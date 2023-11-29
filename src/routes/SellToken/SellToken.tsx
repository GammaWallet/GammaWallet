import React, { useEffect, useState } from 'react'
import userAccount from '../../utils/userAccount'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { IGammaData } from '../../utils/userAccount';
import { IUserAccount } from '../../utils/userAccount';
import utils from '../../utils/utils';
import AddAccount from '../../components/core/AddAccount/AddAccount';
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


  let [currAccount,setCurrAccount] = useState<IUserAccount>()
  let [currAccountInfo,setCurrAccountInfo] = useState<AccountInfo>()
  

  const getCurrAccountInfo = async (currAccount:IUserAccount) => {
    let balance = await getAccountBalance(currAccount.address)
    setCurrAccountInfo({
      address: currAccount.address,
      balance : balance
    })
  }

  const setCurrUserAccount = async (account:IUserAccount) => {
    setCurrAccount(account)
  }

  useEffect(() => {
    if(currAccount) {
      getCurrAccountInfo(currAccount)
    }
  },[currAccount])
  

  return (<>
    <div className='newuserpage-container' style={{paddingTop:0}}>
    <AddAccount setCurrUserAccount={setCurrAccount}></AddAccount>
    <Button variant="primary" style={{marginTop:"0px",marginBottom:"15px"}} onClick={() => {
        currAccountInfo?.address && navigator.clipboard.writeText(currAccountInfo?.address);
      }}>
    Bal : {currAccountInfo?.balance && utils.roundKPlaces(currAccountInfo?.balance,4)} ETH - {currAccountInfo?.address && utils.TruncatedText(currAccountInfo.address,12)}   <FontAwesomeIcon icon={faCopy} />
    </Button>
    <Portfolio currUserAccount={currAccount}></Portfolio>
    <AddToken currUserAccount={currAccount}></AddToken>
    </div>

    </>
  )
}

export default SellToken