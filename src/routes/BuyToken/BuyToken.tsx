import React, { useEffect, useState } from 'react'
import userAccount from '../../utils/userAccount'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { IGammaData } from '../../utils/userAccount';
import { IUserAccount } from '../../utils/userAccount';
import utils from '../../utils/utils';
import AddAccount from '../../components/core/AddAccount/AddAccount'
import { getAccountBalance } from '../../utils/onchain';
import Trade from './Trade';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import ToastMessage from '../../components/core/ToastMessage';
import { useNavigate } from 'react-router-dom';

const ethers = require("ethers")

interface AccountInfo {
  address : string,
  balance : number,

}


const BuyToken = () => {

  
  let [currAccount,setCurrAccount] = useState<IUserAccount>()
  let [currAccountInfo,setCurrAccountInfo] = useState<AccountInfo>()
  const navigate = useNavigate();

  const setCurrUserAccount = async (account:IUserAccount) => {
    setCurrAccount(account)
  }

  const getCurrAccountInfo = async (currAccount:IUserAccount) => {
    let balance = await getAccountBalance(currAccount.address)
    setCurrAccountInfo({
      address: currAccount.address,
      balance : balance
    })
  }

  useEffect(() => {

    const fetchAccountStatus = async () => {
      const resp = await userAccount.getGammaData()
      if(!resp) {
        navigate("/new_user_page")
      }
    }
    fetchAccountStatus();
  },[])

  useEffect(() => {
    if(currAccount) {
      getCurrAccountInfo(currAccount)
    }
  },[currAccount])

 // buildRoute("0xf1291e9d878164712666f52be66fa4f01361b91d","eth",0.01,currAccountInfo?.address,500)

  

  return (<>

    {/*     {currAccountInfo?.address}
    <div className='trade-balance'>{currAccountInfo?.balance} ETH</div>
 */}

    {/*<ToastMessage header={"New Buy"} message={<span onClick={() => utils.openLinkInBrowser("https://etherscan.io/address/0xC36EB04C0bB9c20Ef9F4d3540870322433A1AEB5")}>Transaction</span>}></ToastMessage>*/}

    <div className='newuserpage-container' style={{paddingTop:0}}>
    <AddAccount setCurrUserAccount={setCurrUserAccount}></AddAccount>
    <Button variant="primary" style={{marginTop:"0px",marginBottom:"15px"}} onClick={() => {
        currAccountInfo?.address && navigator.clipboard.writeText(currAccountInfo?.address);
      }}>
    Bal : {currAccountInfo?.balance && utils.roundKPlaces(currAccountInfo?.balance,4)} ETH - {currAccountInfo?.address && utils.TruncatedText(currAccountInfo.address,12)}   <FontAwesomeIcon icon={faCopy} />
    </Button>
    <Trade currUserAccount={currAccount}></Trade>
    </div>

    </>
  )
}

export default BuyToken