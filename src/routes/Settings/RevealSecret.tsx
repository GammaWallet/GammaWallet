import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { IGammaData } from '../../utils/userAccount';
import userAccount from '../../utils/userAccount';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

const RevealSecret = () => {

    const [show, setShow] = useState(false);
    let [userGammaData,setUserGammaData] = useState<IGammaData>()

    const getUserData = async () => {
        const resp = await userAccount.getGammaData()
        setUserGammaData(resp)
    }

    useEffect(() => {
        getUserData()
    },[])
    

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

  return (
    <>
    <Button onClick={handleShow}>Reveal Secret</Button>


    <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Your Secret Phrase</Modal.Title>
          </Modal.Header>
            <Modal.Body className='newuserpage-modal-content'>
              <h3>Secret Recover Phrase</h3>
              <p>The <b>Secret Recovery Phrase</b> provides full access to your wallet and funds</p>
              <p>GammaWallet is a non-custodial wallet</p>
              {<code className='cursor-pointer secret-phrase'   onClick={() => {userGammaData?.userMnemonic &&
        navigator.clipboard.writeText(userGammaData?.userMnemonic);
      }}>{userGammaData?.userMnemonic} <FontAwesomeIcon icon={faCopy} /></code>}
            </Modal.Body>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>

    </>
  )
}

export default RevealSecret