import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button';
import { IGammaData } from '../../utils/userAccount';
import userAccount from '../../utils/userAccount';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { IUserAccount } from '../../utils/userAccount';
import onchain, { getAccountBalance } from '../../utils/onchain';
import AddAccount from '../BuyToken/AddAccount';
import utils from '../../utils/utils';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import Spinner from 'react-bootstrap/Spinner';
import { BigNumber } from 'ethers';

const ethers = require("ethers")

interface ITransferSetup {
    address:string,
    amount:number

}

interface AccountInfo {
    address : string,
    balance : number,
  
  }

const TransferEth = () => {

    let [userAccounts,setUserAccounts] = useState<Array<IUserAccount>>()
    let [userGammaData,setUserGammaData] = useState<IGammaData>()
    let [currAccount,setCurrAccount] = useState<IUserAccount>()
    let [currAccountInfo,setCurrAccountInfo] = useState<AccountInfo>()
    let [customGas,setCustomGas] = useState<BigNumber>();

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [showToast, setShowToast] = useState(false);
    const [toastContent,setToastContent] = useState<JSX.Element>();

    const [transferSetup,setTransferSetup] = useState<ITransferSetup>({
        address:"",
        amount:0,
    });


    const getUserData = async () => {
        const resp = await userAccount.getGammaData()
        ////console.log(resp)
        setUserAccounts(resp.userAccounts)
        setUserGammaData(resp)
        if(resp.userAccounts.length) {
          setCurrAccount(resp.userAccounts[0])
        }
    
        //await userAccount.clearGammaData()
    
      }
    
      const addNewAccount = async () => {
        if(!userGammaData || !userAccounts) {
          ////console.log("ERROR user data or account not found")
          return
        }
        const hdNode = ethers.utils.HDNode.fromMnemonic(userGammaData?.userMnemonic)
        const nextAddressIndex = userAccounts?.length
        const extendedKey = hdNode.derivePath(`m/44'/60'/0'/0/${nextAddressIndex}`);
        const privateKey = extendedKey.privateKey;
        const address = ethers.utils.computeAddress(extendedKey.publicKey);
        let newAccount : IUserAccount = {
          address:address,
          privateKey:privateKey,
          tokens : []
        }
        await userAccount.setGammaData({...userGammaData,userAccounts:[...userAccounts,newAccount]})    
        setUserGammaData({...userGammaData,userAccounts:[...userAccounts,newAccount]})
        setUserAccounts([...userAccounts,newAccount])
        
        setCurrAccount(newAccount)
        
      }
    
      const changeAccount = async (newAccount:IUserAccount) => {
        setCurrAccount(newAccount)
      }
    
      const getCurrAccountInfo = async (currAccount:IUserAccount) => {
        let balance = await getAccountBalance(currAccount.address)
        setCurrAccountInfo({
          address: currAccount.address,
          balance : balance
        })
      }
    
    useEffect(() => {
    getUserData()
    },[])

    useEffect(() => {
    if(currAccount) {
        getCurrAccountInfo(currAccount)
    }
    },[currAccount])

    const validTransferSetup = async () => {
        if(transferSetup.address && !utils.isValidEthereumAddress(transferSetup.address)) {
            return {success:false,res:"Address is not valid"}
        }
        if(!utils.isValidNumber(transferSetup.amount)) {
            return {success:false,res:"Amount is not valid"}
        }

        if(!currAccount?.address) {
            return {success:false,res:"Failed to load user account"}
        }

        let currAccountBalance = await onchain.getAccountBalance(currAccount?.address)

        if(transferSetup.amount && currAccountBalance < transferSetup.amount) {
          return {success:false,res:"You don't have enough balance to make this trade"}
        }

        return {success:true,res:"Valid"}


    }

    const fillAmountAll = async() => {
        if(currAccount?.privateKey) {
            let res = await onchain.maxSendableEth(currAccount?.privateKey)
            setTransferSetup({
                ...transferSetup,
                amount:res.maxSendableEth
            })
            setCustomGas(res.gasPrice)
        }
    }

    const doTransfer = async () => {
        let res = await validTransferSetup()
        if(!res.success) {
            handleClose()
            setToastContent(<div>{res.res}</div>)
            setShowToast(true)
        } else {
            if(currAccount?.privateKey) {
                handleClose()
                setToastContent(<div> {<Spinner animation="border" size="sm"/>}</div>)
                setShowToast(true)
                if(customGas) {
                    let res = await onchain.transferEthWithGasPrice(transferSetup.address,transferSetup.amount,currAccount?.privateKey,customGas)
                    let txLink = "https://etherscan.io/tx/"+res.res
                    chrome.tabs.create({ url: txLink });
                } else {
                    let res = await onchain.transferEth(transferSetup.address,transferSetup.amount,currAccount?.privateKey)
                    let txLink = "https://etherscan.io/tx/"+res.res
                    chrome.tabs.create({ url: txLink });
                }
                
            }
            
        }
    }

  return (
    <>
        <ToastContainer
      className="p-3"
      position="top-start"
      style={{ zIndex: 1 }}
    >
      <Toast onClose={() => setShowToast(false)} show={showToast}>
      <Toast.Header>
        <strong className="me-auto">Transferring</strong>
      </Toast.Header>
      <Toast.Body>{toastContent}</Toast.Body>
    </Toast>
  </ToastContainer>

    <Button onClick={handleShow}>Transfer Eth</Button>

    <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Transfer</Modal.Title>
          </Modal.Header>
            <Modal.Body className='newuserpage-modal-content'>
            <AddAccount addNewAccount={addNewAccount} userAccounts={userAccounts} changeAccount={changeAccount}></AddAccount>
            
            <Button variant="primary" style={{marginTop:"0px",marginBottom:"15px"}} onClick={() => {
        currAccountInfo?.address && navigator.clipboard.writeText(currAccountInfo?.address);
      }}>
    Bal : {currAccountInfo?.balance && utils.roundKPlaces(currAccountInfo?.balance,4)} ETH - {currAccountInfo?.address && utils.TruncatedText(currAccountInfo.address,12)}   <FontAwesomeIcon icon={faCopy} />
    </Button>

              <h3>Enter ETH Address</h3>
              <Form className='trade-form' onSubmit={doTransfer}>
    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1" style={{textAlign:"left"}}>
      <Form.Control type="text" placeholder="ETH Address" onChange={(event) => setTransferSetup({address:event.target.value,amount:transferSetup?.amount})} autoComplete="off"/>
      <div style={{ display: 'flex', alignItems: 'center' }}>
      <Form.Control type="text" placeholder="Amount ETH" onChange={(event) => setTransferSetup({address:transferSetup.address,amount:parseFloat(event.target.value)})} value={transferSetup.amount} autoComplete="off"/>
      <Button variant="secondary" style={{marginBottom:"10px"}} onClick={fillAmountAll}>All</Button>
      </div>

    </Form.Group>
    
    <Button onClick={doTransfer}>Transfer</Button>
  </Form>
            </Modal.Body>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>

    </>
  )
}

export default TransferEth