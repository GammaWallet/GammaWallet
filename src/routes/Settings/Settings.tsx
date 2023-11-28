import React from 'react'
import Button from 'react-bootstrap/Button';
import RevealSecret from './RevealSecret';
import TransferEth from './TransferEth';
import GasSetting from './GasSetting';
import utils from '../../utils/utils';

const Settings = () => {
  return (
    <div className='newuserpage-container' style={{paddingTop:0}}>
    <TransferEth></TransferEth>
    <GasSetting></GasSetting>
    <Button onClick={() => utils.openLinkInBrowser("https://gammawallet.gitbook.io/gammawallet-docs/")}>How To Use</Button>
    <Button onClick={() => utils.openLinkInBrowser("https://t.me/gamma_wallet")}>Telegram</Button>
    <Button onClick={() => utils.openLinkInBrowser("https://twitter.com/gammawallet")}>Twitter</Button>
    <RevealSecret></RevealSecret>
    <Button> Version : 1.0.2</Button>
    </div>
  )
}

export default Settings