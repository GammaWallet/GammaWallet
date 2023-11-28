import { IToken, IUserAccount } from '../../utils/userAccount'
import React, { useState, ChangeEvent, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import utils from '../../utils/utils';
import { buildRouteAndBuy, findOptimalSlippage, getTokenValue } from '../../utils/kyberSwap';
import onchain, { getDecimals, getTokenBalance } from '../../utils/onchain';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faGasPump } from '@fortawesome/free-solid-svg-icons';
import { KYBERSWAP_AGGREGATOR_ADDRESS } from '../../utils/constants';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';

const ethers = require("ethers")

interface PortfolioProps {
    currUserAccount : IUserAccount | undefined,
    getUserData : () => void;
}

interface ITokenValueData {
    tokenAddress : string,
    tokenSymbol : string,
    tokenName : string,
    tokenBalance : number,
    tokenBalanceUsd : number,
    tokenBalanceEth : number
}

interface sellSetup {
    tokenAddress:string,
    tokenName:string,
    tokenSymbol:string,
    tokenBalance:number,
    tokenBalanceEth:number,
    tokenBalanceUsd:number,
    percentageToSell:number,
    maxSlippage:number,
    mevProtection:boolean,
    failGuard:boolean,
    gasFeeUsd : number,
    approvalNeeded:boolean
}

const Portfolio : React.FC<PortfolioProps> = ({currUserAccount,getUserData}) => {
    let [portData,setPortData] = useState<Array<ITokenValueData>>([]);
    let [portDataLoading,setPortDataLoading] = useState<boolean>(true);
    let [filteredPortData,setFilteredPortData] = useState<Array<ITokenValueData>>([]);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [showSellLoading,setShowSellLoading] = useState(true)

    const [showToast, setShowToast] = useState(false);
    const [toastContent,setToastContent] = useState<JSX.Element>();
  

    const [currSellSetup,setCurrSellSetup] = useState<sellSetup>(
        {
            tokenAddress:"",
            tokenName:"",
            tokenSymbol:"",
            tokenBalance:0,
            tokenBalanceEth:0,
            tokenBalanceUsd:0,
            percentageToSell:0,
            maxSlippage:0.5,
            mevProtection:true,
            failGuard:true,
            gasFeeUsd:0,
            approvalNeeded:false
        }
    );

    const initSellSetup = async (tokenData:ITokenValueData) => {

        setShowSellLoading(true)
        handleShow()
        
        let tokenAddress = tokenData.tokenAddress
        let userTokenBalance = await getTokenBalance(currUserAccount?.address,tokenAddress)
        let decimals = await getDecimals(tokenAddress)
        let userTokenBalanceFinal = ethers.utils.formatUnits(userTokenBalance,decimals)
        let routeData = await getTokenValue(tokenAddress,userTokenBalanceFinal)
        let tokenBalanceEth = 0;
        let tokenBalanceUsd = 0;
        let gasFeeUsd = 0;
        if(routeData.success) {
          tokenBalanceEth = ethers.utils.formatEther(routeData.res.amountOut)
          tokenBalanceUsd = routeData.res.amountOutUsd
          gasFeeUsd = routeData.res.gasUsd
        }

        let approvalNeeded = false
        if(currUserAccount) {
          approvalNeeded = await onchain.checkIfApproveNeeded(currUserAccount,tokenAddress,KYBERSWAP_AGGREGATOR_ADDRESS,0)
        }
        

        setCurrSellSetup({
            tokenAddress:tokenData.tokenAddress,
            tokenName:tokenData.tokenName,
            tokenSymbol:tokenData.tokenSymbol,
            tokenBalance:tokenData.tokenBalance,
            tokenBalanceEth:tokenBalanceEth,
            tokenBalanceUsd:tokenBalanceUsd,
            maxSlippage:0.5,
            mevProtection:true,
            failGuard:true,
            percentageToSell:50,
            gasFeeUsd:gasFeeUsd,
            approvalNeeded:approvalNeeded
        })

        setShowSellLoading(false)
        

    }

    const updateSellSetupRange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrSellSetup(prevState => ({
            ...prevState,
            percentageToSell:parseInt(e.target.value)
          }))

          ////console.log(currSellSetup)
    }

    const updateSellSetup = async (_event:React.ChangeEvent<HTMLInputElement>,_property:string) => { 
        if(_property == "maxSlippage") {
            if(utils.isValidNumber(_event.target.value)) {
                let val : number = parseFloat(_event.target.value)
                setCurrSellSetup(prevState => ({
                  ...prevState,
                  maxSlippage:val
                }))
            }
          } else if(_property == "mevProtection") {
            let val : boolean = _event.target.checked
            setCurrSellSetup(prevState => ({
              ...prevState,
              mevProtection:val
            }))
          } else if(_property == "failGuard") {
            let val : boolean = _event.target.checked
            setCurrSellSetup(prevState => ({
              ...prevState,
              failGuard:val
            }))
          }
    }

    const sellTokens = async () => {
        if(currUserAccount) {
          handleClose()
          setToastContent(<div> {<Spinner animation="border" size="sm"/>}</div>)
          setShowToast(true)
          try {
            let userTokenBalance = await getTokenBalance(currUserAccount.address,currSellSetup.tokenAddress)
            let decimals = await getDecimals(currSellSetup.tokenAddress)
            let amount = ethers.utils.formatUnits(userTokenBalance.mul(currSellSetup.percentageToSell).div(100),decimals)

            setToastContent(<div> Finding Optimal Slippage{<Spinner animation="border" size="sm"/>}</div>)

            let slippage = await findOptimalSlippage(currSellSetup.tokenAddress,"eth",amount,currUserAccount,currSellSetup.maxSlippage*100,currSellSetup.mevProtection)

            setToastContent(<div> Executing Trade{<Spinner animation="border" size="sm"/>}</div>)

            let res = await buildRouteAndBuy(currSellSetup.tokenAddress,"eth",amount,currUserAccount,Math.round(slippage*100),currSellSetup.mevProtection)
            let txLink = "https://etherscan.io/tx/"+res.res
            chrome.tabs.create({ url: txLink });

            setToastContent(<div>
              <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red' }} /> <a href={txLink}>Transaction</a></div>)
            setShowToast(true)

          } catch {
            setToastContent(<div>
              <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red' }} /> {"Unable to sell token"}</div>)
            setShowToast(true)
          }
        }
    }

    const approveTokens = async () => {
      if(currUserAccount) {
        handleClose()
        setToastContent(<div> {<Spinner animation="border" size="sm"/>}</div>)
        setShowToast(true)
        try {
          let res = await onchain.infiniteApproveWithoutNonce(currUserAccount,currSellSetup.tokenAddress,KYBERSWAP_AGGREGATOR_ADDRESS)
          let txLink = "https://etherscan.io/tx/"+res.res
          //chrome.tabs.create({ url: txLink });

          setCurrSellSetup(prevState => ({
            ...prevState,
            approvalNeeded:false
          }))

          setToastContent(<div>
            <FontAwesomeIcon icon={faCheck} style={{ color: 'green' }} /> <a href={txLink}>Transaction</a></div>)
          setShowToast(true)

          

        } catch {
          setToastContent(<div>
            <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red' }} /> {"Unable to approve token"}</div>)
          setShowToast(true)
        }
      }
    }

    const filterPortData = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const filteredData = portData.filter(item =>
        item.tokenSymbol.toLowerCase().includes(e.target.value.toLowerCase()) || item.tokenAddress.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setFilteredPortData(filteredData)
    }

    

    useEffect(() => {
        const fetchAll = async () => {
            let allTokens = currUserAccount?.tokens
            let res : ITokenValueData[]  = []
            if(allTokens) {
                for(const token of allTokens) {
                  res.push({
                    tokenAddress : token.address,
                    tokenSymbol : token.symbol,
                    tokenName : token.name,
                    tokenBalance : 0,
                    tokenBalanceUsd : 0,
                    tokenBalanceEth : 0
                  })
                }
            }

            

            ////console.log(allTokens)

            setPortData(res)
            setFilteredPortData(res)

        }

        fetchAll()

        ////console.log("triggered this")

    },[currUserAccount])

  
return (<> 
    <ToastContainer
      className="p-3"
      position="top-start"
      style={{ zIndex: 1 }}
    >
      <Toast onClose={() => setShowToast(false)} show={showToast}>
      <Toast.Header>
        <strong className="me-auto">Selling tokens</strong>
      </Toast.Header>
      <Toast.Body>{toastContent}</Toast.Body>
    </Toast>
  </ToastContainer>

            <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Sell Token</Modal.Title>
          </Modal.Header>
            <Modal.Body className='newuserpage-modal-content'>
              {showSellLoading?<Spinner animation="border" size="sm"/>:<>
              Token : {currSellSetup?.tokenName}<br></br>
              Value USD : {Number(currSellSetup?.tokenBalanceUsd).toFixed(3)}<br></br>
              Value ETH : {Number(currSellSetup?.tokenBalanceEth).toFixed(3)}<br></br> 
              % To Sell : {currSellSetup?.percentageToSell}<br></br> 
              Sell Value (Approx) : {Number((currSellSetup?.percentageToSell) * currSellSetup?.tokenBalanceUsd/100).toFixed(3)} USD<br></br>
              <span style={{textAlign:"left"}}><FontAwesomeIcon icon={faGasPump} /> :  {currSellSetup.gasFeeUsd ? Number(currSellSetup.gasFeeUsd).toFixed(3) + "USD" : ""}</span> 
              </>
              }

              <Form className='trade-form' onSubmit={sellTokens}>
    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1" style={{textAlign:"left"}}>
      <Form.Range min={1} max={100} onChange={updateSellSetupRange}/>

     {/* <Form.Control type="text" placeholder="Max Slippage"  onChange={(event) => updateSellSetup(event as React.ChangeEvent<HTMLInputElement>,"maxSlippage")} defaultValue={currSellSetup.maxSlippage}/>*/}
      <Form.Check type="checkbox" id="default-checkbox" label="MEV Protection" onChange={(event) => updateSellSetup(event as React.ChangeEvent<HTMLInputElement>,"mevProtection")} defaultChecked/>

      <Form.Check type="checkbox" id="default-checkbox" label="FailGuard" onChange={(event) => updateSellSetup(event as React.ChangeEvent<HTMLInputElement>,"failGuard")} defaultChecked/>

    </Form.Group>
    {currSellSetup.approvalNeeded?<Button onClick={approveTokens}> Approve</Button>:<Button onClick={sellTokens}>Sell</Button>}
    
  </Form>

            </Modal.Body>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>

    <Form.Control type="text" placeholder="Search Token by symbol or address" onChange={filterPortData}/>
  <div className='portfolio' style={{width:"300px"}}>
    <ListGroup as="ol" numbered>
  {filteredPortData?.map( item => (
          <ListGroup.Item
          as="li"
          className="d-flex justify-content-between align-items-start"
          onClick={() => initSellSetup(item)}>
          <div className="ms-2 me-auto">
            <div className="fw-bold">{item.tokenSymbol}</div>
            {utils.TruncatedText(item.tokenAddress,8)}
          </div>
         {/** <Badge bg="primary" pill>
            $2313.2
  </Badge> **/}
        </ListGroup.Item>
    ))} {filteredPortData.length == 0? <Button style={{marginTop:"5px"}}>No Tokens</Button>:""}</ListGroup>
    </div>
    </>
  )
}

export default Portfolio