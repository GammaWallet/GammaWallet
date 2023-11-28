import React, { useEffect } from 'react'
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
const ethers = require("ethers")
import userAccount from '../../utils/userAccount';
import { IGammaData } from '../../utils/userAccount';
import { v4 as uuidv4 } from 'uuid';
import { IUserAccount } from '../../utils/userAccount';
import {Routes, Route, useNavigate} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

interface userWallet {
    address:string,
    privateKey:string,
    mnemonic:string
}

const CreateNewWallet = () => {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [newUserWallet,setNewUserWallet] = useState<userWallet>()

    const navigate = useNavigate()

    const createUserWallet = async () => {

      if(newUserWallet == undefined) {
        //console.log("New User Wallet is undefined ERROR")
        return
      }

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

    const getRandomWallet = () => {
        let newRandomWallet = ethers.Wallet.createRandom()
        let newWallet : userWallet = {
            address:newRandomWallet.address,
            privateKey:newRandomWallet.privateKey,
            mnemonic:newRandomWallet.mnemonic.phrase
        }
        //console.log("mneomic",newWallet.mnemonic)
        return newWallet
    }

    useEffect(()=> {
        if(!newUserWallet) {
            let randWallet = getRandomWallet()
            setNewUserWallet(randWallet)
        }
        
    },[])
  
    return (
      <>
        <Button variant="primary" onClick={handleShow}>
          Create New Wallet
        </Button>
  
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Create A New Wallet</Modal.Title>
          </Modal.Header>
            <Modal.Body className='newuserpage-modal-content'>
              <h3>Secret Recovery Phrase</h3>
              <p>The <b>Secret Recovery Phrase</b> provides full access to your wallet and funds</p>
              <p>GammaWallet is a non-custodial onchain trading tool. <b>Private keys and secret phrase are stored in your browser and never requested by our servers.</b></p>
              {newUserWallet?.mnemonic? <code className='cursor-pointer'   onClick={() => {
        navigator.clipboard.writeText(newUserWallet?.mnemonic);
      }}>{newUserWallet?.mnemonic} <FontAwesomeIcon icon={faCopy} /></code>: ""} <br></br>
            </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={createUserWallet}>
              Create Wallet
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
}

export default CreateNewWallet