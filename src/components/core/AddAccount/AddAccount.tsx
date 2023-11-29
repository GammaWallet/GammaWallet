import React, { MouseEventHandler,useEffect, useState } from 'react'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { IUserAccount } from '../../../utils/userAccount';
import utils from '../../../utils/utils';
import { IGammaData } from '../../../utils/userAccount';
import userAccount from '../../../utils/userAccount'
const ethers = require("ethers")


interface AddAccountProps {
    //addNewAccount:MouseEventHandler<HTMLElement> | undefined,
    //userAccounts:Array<IUserAccount> | undefined,
    setCurrUserAccount:(data:IUserAccount) => void
}

const AddAccount : React.FC<AddAccountProps> = ({setCurrUserAccount}) => {

  let [userAccounts,setUserAccounts] = useState<Array<IUserAccount>>()
  let [userGammaData,setUserGammaData] = useState<IGammaData>()

  const getUserData = async () => {
    const resp = await userAccount.getGammaData()
    //console.log(resp)
    setUserAccounts(resp.userAccounts)
    setUserGammaData(resp)
    if(resp.userAccounts.length) {
      setCurrUserAccount(resp.userSettings.lastUsedAccount)
    }
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
    await userAccount.setGammaData({...userGammaData,userAccounts:[...userAccounts,newAccount],userSettings:{
        ...userGammaData.userSettings,
        lastUsedAccount : newAccount
    }})    
    setUserGammaData({...userGammaData,userAccounts:[...userAccounts,newAccount],userSettings:{
        ...userGammaData.userSettings,
        lastUsedAccount : newAccount
    }})
    setUserAccounts([...userAccounts,newAccount])
    
    setCurrUserAccount(newAccount)
    
  }

  const changeAccount = async (newAccount:IUserAccount) => {
    setCurrUserAccount(newAccount)
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

  useEffect(() => {
    getUserData();
  },[])

  return (
    <DropdownButton id="dropdown-item-button" title="Account" style={{marginBottom:"10px"}}>
    <Dropdown.Item as="button" onClick={addNewAccount}>+ Add Account</Dropdown.Item>
      {userAccounts?.map((obj) => (<Dropdown.Item onClick={() => changeAccount(obj)} as="button">{utils.TruncatedText(obj.address,15)}</Dropdown.Item>))}
      
    </DropdownButton>
  )
}

export default AddAccount