import React from 'react'
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import {useNavigate} from 'react-router-dom';
import utils from '../../utils/utils';
import { v4 as uuidv4 } from 'uuid';
import { IUserAccount } from '../../utils/userAccount';
import userAccount from '../../utils/userAccount';
import { IGammaData } from '../../utils/userAccount';
import InputGroup from 'react-bootstrap/InputGroup';


const ethers = require("ethers")

interface userWallet {
  address:string,
  privateKey:string,
  mnemonic:string
}




const ImportWallet = () => {
    const [show, setShow] = useState(false);
    const [userSecretPhrase,setUserSecretPhrase] = useState("")
    const [userSecretIsValid,setUserSecretIsValid] = useState(false)
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const navigate = useNavigate()
    

    const importUserWallet = async () => {

      
      let isValid = utils.isMnemonicValid(userSecretPhrase)
      console.log("valid mneomic = ",isValid)
      if(!isValid) {
        setUserSecretIsValid(true)
        return
      }

      const wallet = ethers.Wallet.fromMnemonic(userSecretPhrase);


      let newUserWallet : userWallet = {
        address:wallet.address,
        privateKey:wallet.privateKey,
        mnemonic:wallet.mnemonic.phrase
      }

      console.log(newUserWallet)

      let currAccount : IUserAccount = {
        address:newUserWallet?.address,
        privateKey:newUserWallet?.privateKey,
        tokens : []
      }

      let userGammaData : IGammaData = {
        userId:uuidv4(),
        userAccounts : [currAccount],
        userMnemonic : newUserWallet?.mnemonic,
        userSettings : {
          gasPriceMultiplier : 1,
          lastUsedAccount : currAccount
        }
      }

      await userAccount.setGammaData(userGammaData)
      setShow(false)

      navigate("/trade_token")

    }
  
    return (
      <>
        <Button variant="primary" onClick={handleShow}>
          Import Wallet
        </Button>
  
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Import Wallet</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <h3>Secret Recovery Phrase</h3>
            <p>The <b>Secret Recovery Phrase</b> provides full access to your wallet and funds</p>
              <p>GammaWallet is a non-custodial onchain trading tool. <b>Private keys and secret phrase are stored in your browser and never requested by our servers.</b></p>
          <InputGroup hasValidation>
            <Form.Control type="text" placeholder="Enter Secret Phrase" onChange={(event) => setUserSecretPhrase(event.target.value)} autoComplete="off" isInvalid={userSecretIsValid} required/>
            <Form.Control.Feedback type="invalid">
        Invalid secret recovery phrase.
      </Form.Control.Feedback>
          </InputGroup>

</Modal.Body>
          <Modal.Footer>
          <Button variant="primary" onClick={importUserWallet}>
              Import Wallet
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
}

export default ImportWallet