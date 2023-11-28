import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import userAccount, { IToken, IUserAccount } from '../../utils/userAccount';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import onchain, { getTokenToAddData } from '../../utils/onchain';
import utils from '../../utils/utils';
import { buildAndSimulate, buildRouteAndBuy, findOptimalSlippage, getKyberRoute } from '../../utils/kyberSwap';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import Spinner from 'react-bootstrap/Spinner';
import { faGasPump } from '@fortawesome/free-solid-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

interface TradeProps {
    currUserAccount : IUserAccount | undefined
}

interface ITradeSetup {
  tokenAddress:string | undefined,
  amountEth:number | undefined,
  maxSlippage:number | undefined,
  mevProtection:boolean | undefined
  tokensOut : number | undefined,
  tokenDecimals : number | undefined
  failGuard : boolean | undefined,
  gasFeeUsd : number | undefined
}

const Trade : React.FC<TradeProps> = ({currUserAccount}) => {

  let [currTradeSetup,setCurrTradeSetup] = useState<ITradeSetup>({
    tokenAddress : "",
    amountEth : 0,
    maxSlippage : 0.5,
    mevProtection : true,
    tokensOut : 0,
    tokenDecimals : 0,
    failGuard : true,
    gasFeeUsd : 0
  })

  const [showToast, setShowToast] = useState(false);
  const [showSlippageLoading,setShowSlippageLoading] = useState(false)
  const [toastContent,setToastContent] = useState<JSX.Element>();
  const [tokensOutUpdateReq,setTokensOutUpdateReq] = useState(0)
  const maxSlippageRef =  useRef<HTMLInputElement | null>(null); 

  const updateTokensOut = async () => {
    let isValidToken = currTradeSetup.tokenAddress && await onchain.isValidTokenAddress(currTradeSetup.tokenAddress)
    let isValidNum = utils.isValidNumber(currTradeSetup.amountEth)

    if(isValidNum && isValidToken && currTradeSetup.tokenAddress && currTradeSetup.amountEth) {
      ////console.log("updating here")
      let route = (await getKyberRoute("eth",currTradeSetup.tokenAddress,currTradeSetup.amountEth)).res.data.routeSummary
      setCurrTradeSetup(prevState => ({
        ...prevState,
        tokensOut : route.amountOut,
        gasFeeUsd : route.gasUsd
      }))
    }

  }

  const autoFillSlippage = async () => {
    if(currTradeSetup.tokenAddress && currTradeSetup.amountEth && currUserAccount && currTradeSetup.maxSlippage) {

      setShowSlippageLoading(true)

      let txRes = await findOptimalSlippage("eth",currTradeSetup.tokenAddress,currTradeSetup.amountEth,currUserAccount,(currTradeSetup.maxSlippage)*100,currTradeSetup.mevProtection)

      //console.log("Found optimal slippage",txRes)
      
      setCurrTradeSetup(prevState => ({
        ...prevState,
        maxSlippage:txRes
      }))
      if(maxSlippageRef.current ) {
        maxSlippageRef.current.value = txRes.toString()
      }

      setShowSlippageLoading(false)
    }
  }
  
  const updateTradeSetup = async (_event:React.ChangeEvent<HTMLInputElement>,_property:string) => {
    if(_property == "tokenAddress") {
      let isValid = await onchain.isValidTokenAddress(_event.target.value) 
      if(isValid) {
        let val:string = _event.target.value
        let decimals = await onchain.getDecimals(val)
        setCurrTradeSetup(prevState => ({
          ...prevState,
          tokenAddress:val,
          tokenDecimals:decimals
        }))
        setTokensOutUpdateReq((val) => val + 1)
      }
    } else if(_property == "amountEth") {
        if(utils.isValidNumber(_event.target.value)) {
            let val : number = parseFloat(_event.target.value)
            setCurrTradeSetup(prevState => ({
              ...prevState,
              amountEth:val
            }))
            setTokensOutUpdateReq((val) => val + 1)
        }
    } else if(_property == "maxSlippage") {
      if(utils.isValidNumber(_event.target.value) || _event.target.value == "") {
          let val : number = parseFloat(_event.target.value)
          setCurrTradeSetup(prevState => ({
            ...prevState,
            maxSlippage:( _event.target.value != "")?val:0
          }))
      }
    } else if(_property == "mevProtection") {
      let val : boolean = _event.target.checked
      setCurrTradeSetup(prevState => ({
        ...prevState,
        mevProtection:val
      }))
    } else if(_property == "failGuard") {
      let val : boolean = _event.target.checked
      setCurrTradeSetup(prevState => ({
        ...prevState,
        failGuard:val
      }))
    }

    ////console.log(currTradeSetup)

  }

  useEffect(()=> {
    updateTokensOut()
  },[tokensOutUpdateReq])

  useEffect(() => {
    if(maxSlippageRef.current ) {
      maxSlippageRef.current.value = "0.5"
    }
  },[])


  const validDateTradeSetup = async () => {
    
    let _valid1 = currTradeSetup.tokenAddress && await onchain.isValidTokenAddress(currTradeSetup.tokenAddress)
    let _valid2 = currTradeSetup.amountEth && currTradeSetup.amountEth > 0 && utils.isValidNumber(currTradeSetup.amountEth)
    let _valid3 = currTradeSetup.maxSlippage && currTradeSetup.maxSlippage < 100 && currTradeSetup.maxSlippage >= 0 && utils.isValidNumber(currTradeSetup.maxSlippage)

    if(!_valid1) {
      return {success:false,res:"Token address isn't valid"}
    } 
    if(!_valid2) {
      return {success:false,res:"Amount eth isn't valid"}
    }
    if(!_valid3) {
      return {success:false,res:"Max slippage isn't valid"}
    }

    if(!currUserAccount?.address) {
      return {success:false,res:"Invalid Account"}
    }

    let currAccountBalance = await onchain.getAccountBalance(currUserAccount?.address)

    if(currTradeSetup.amountEth && currAccountBalance <= currTradeSetup.amountEth) {
      return {success:false,res:"You don't have enough balance to make this trade"}
    }
    

    return {success:true,res:"Valid"}


  }

  const addTokenToCurr = async (tokenToAdd:IToken) => {
    if(tokenToAdd && await onchain.isValidTokenAddress(tokenToAdd.address)) {
        let tokenToAddData = await getTokenToAddData(tokenToAdd.address)
        ////console.log("Here",currUserAccount)
        if(currUserAccount) {
            
            const doesNotExist: boolean = currUserAccount.tokens.every((item:IToken) => item.address.toLowerCase() !== tokenToAdd.address.toLocaleLowerCase());

            ////console.log(doesNotExist)

            if(doesNotExist) {
                currUserAccount.tokens.push(tokenToAddData)
            }
            let userGammaData = await userAccount.getGammaData()
            for(let i = 0 ; i < userGammaData.userAccounts.length;i++) {
                if(userGammaData.userAccounts[i].address == currUserAccount.address) {
                    userGammaData.userAccounts[i] = currUserAccount
                    userGammaData.userSettings.lastUsedAccount = currUserAccount
                }
            }
            await userAccount.setGammaData(userGammaData)
            
        }

    }
  }

  


  const triggerBuy = async () => {

    setToastContent(<div> {<Spinner animation="border" size="sm"/>}</div>)
    setShowToast(true)

    let isValidSetup = await validDateTradeSetup()
    if(!isValidSetup.success) {
      setToastContent(<div>
        <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red' }} /> {isValidSetup.res}</div>)
      setShowToast(true)
      return
    }

    if(!currTradeSetup.tokenAddress || !currTradeSetup.amountEth || !currUserAccount?.address || !currTradeSetup.maxSlippage) return

    try {

      setToastContent(<div> Finding Optimal Slippage {<Spinner animation="border" size="sm"/>}</div>)

      let slippage = await findOptimalSlippage("eth",currTradeSetup.tokenAddress,currTradeSetup.amountEth,currUserAccount,Math.round(100*(currTradeSetup.maxSlippage)),currTradeSetup.mevProtection)

      setToastContent(<div> Executing Trade {<Spinner animation="border" size="sm"/>}</div>)

      let res = await buildRouteAndBuy("eth",currTradeSetup.tokenAddress,currTradeSetup.amountEth,currUserAccount,Math.round(100*(slippage)),currTradeSetup.mevProtection)

      if(!res.success) {
        setToastContent(<div>
          <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red' }} /> {"Error trying to buy tokens"}</div>)
        setShowToast(true)
        return
      }
  
      
      let txLink = "https://etherscan.io/tx/"+res.res
      let currToken:IToken = {
        address:currTradeSetup.tokenAddress,
        decimals:0,
        name:"",
        symbol:"",
      }
      await addTokenToCurr(currToken)
  
      setToastContent(<div>
        <FontAwesomeIcon icon={faCheck} style={{ color: 'green' }} /> <a href={txLink} onClick={() => utils.openLinkInBrowser(txLink)}>Transaction</a></div>)
      setShowToast(true)
      chrome.tabs.create({ url: txLink });

    } catch {
      setToastContent(<div>
        <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red' }} /> {"Unable to buy token"}</div>)
      setShowToast(true)
    }
    
  }

  return (<>

  <ToastContainer
      className="p-3"
      position="top-start"
      style={{ zIndex: 1 }}
    >
      <Toast onClose={() => setShowToast(false)} show={showToast}>
      <Toast.Header>
        <strong className="me-auto">New Buy</strong>
      </Toast.Header>
      <Toast.Body>{toastContent}</Toast.Body>
    </Toast>
  </ToastContainer>

    <Form className='trade-form' onSubmit={triggerBuy}>
    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1" style={{textAlign:"left"}}>
      <Form.Control type="text" placeholder="Enter Token Address" onChange={(event) => updateTradeSetup(event as React.ChangeEvent<HTMLInputElement>,"tokenAddress")} autoComplete="off" />
      <Form.Control type="text" placeholder="Amount ETH" onChange={(event) => updateTradeSetup(event as React.ChangeEvent<HTMLInputElement>,"amountEth")} autoComplete="off"/>
      <Form.Control
        type="text"
        placeholder="Tokens Out"
        aria-label="Disabled input example"
        value = {currTradeSetup.tokensOut}
        disabled
        readOnly
      />

    {/*<div style={{ display: 'flex', alignItems: 'center' }}>
    <Form.Control type="text" placeholder="Max Slippage"  onChange={(event) => updateTradeSetup(event as React.ChangeEvent<HTMLInputElement>,"maxSlippage")} ref={maxSlippageRef} autoComplete="off"/>
  <Button onClick={autoFillSlippage} style={{marginTop:"-10px",marginLeft:"10px"}}>{showSlippageLoading?<Spinner animation="border" size="sm"/>:"Auto Fill"}</Button>
  </div>*/}



      <Form.Check type="checkbox" id="default-checkbox" label="MEV Protection" onChange={(event) => updateTradeSetup(event as React.ChangeEvent<HTMLInputElement>,"mevProtection")} defaultChecked/>

      <Form.Check type="checkbox" id="default-checkbox" label="FailGuard" onChange={(event) => updateTradeSetup(event as React.ChangeEvent<HTMLInputElement>,"failGuard")} defaultChecked/>
      <span style={{textAlign:"left"}}><FontAwesomeIcon icon={faGasPump} /> :  {currTradeSetup.gasFeeUsd ? Number(currTradeSetup.gasFeeUsd).toFixed(3) + "USD" : ""}</span>
    </Form.Group>
    <Button onClick={triggerBuy} style={{position:"absolute",bottom:"50px",width:"270px"}}>Buy</Button>
  </Form>
  </>
  )
}

export default Trade