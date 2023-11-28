import React, { useEffect, useState } from 'react'
import userAccount from '../../utils/userAccount'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { IGammaData } from '../../utils/userAccount';
import { IUserAccount } from '../../utils/userAccount';
import utils from '../../utils/utils';
import AddAccount from './AddAccount';
import { getAccountBalance } from '../../utils/onchain';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import ToastMessage from '../../components/core/ToastMessage';
import AddToken from './AddToken';
import Portfolio from './Portfolio';

const ethers = require("ethers")

interface AccountInfo {
  address : string,
  balance : number,
}


const SellToken = () => {

  let [userAccounts,setUserAccounts] = useState<Array<IUserAccount>>()
  let [userGammaData,setUserGammaData] = useState<IGammaData>()
  let [currAccount,setCurrAccount] = useState<IUserAccount>()
  let [currAccountInfo,setCurrAccountInfo] = useState<AccountInfo>()
  
  const getUserData = async () => {
    const resp = await userAccount.getGammaData()
    //console.log(resp)
    setUserAccounts(resp.userAccounts)
    setUserGammaData(resp)
    if(resp.userAccounts.length) {
      setCurrAccount(resp.userSettings.lastUsedAccount)
    }

    //await userAccount.clearGammaData()

  }

  const addNewAccount = async () => {
    if(!userGammaData || !userAccounts) {
      //console.log("ERROR user data or account not found")
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
    if(!userGammaData) return
    await userAccount.setGammaData({...userGammaData,userSettings:{
        ...userGammaData.userSettings,
        lastUsedAccount : newAccount
    }})    
    setUserGammaData({...userGammaData,userSettings:{
        ...userGammaData.userSettings,
        lastUsedAccount : newAccount
    }})
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
    //console.log("just ran this",currAccount)
  },[currAccount])

 // buildRoute("0xf1291e9d878164712666f52be66fa4f01361b91d","eth",0.01,currAccountInfo?.address,500)

  

  return (<>
    <div className='newuserpage-container' style={{paddingTop:0}}>
    <AddAccount addNewAccount={addNewAccount} userAccounts={userAccounts} changeAccount={changeAccount}></AddAccount>
    <Button variant="primary" style={{marginTop:"0px",marginBottom:"15px"}} onClick={() => {
        currAccountInfo?.address && navigator.clipboard.writeText(currAccountInfo?.address);
      }}>
    Bal : {currAccountInfo?.balance && utils.roundKPlaces(currAccountInfo?.balance,4)} ETH - {currAccountInfo?.address && utils.TruncatedText(currAccountInfo.address,12)}   <FontAwesomeIcon icon={faCopy} />
    </Button>
    <Portfolio currUserAccount={currAccount} getUserData={getUserData}></Portfolio>
    <AddToken currUserAccount={currAccount} getUserData={getUserData}></AddToken>
    </div>

    </>
  )
}

export default SellToken