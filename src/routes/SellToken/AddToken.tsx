import React from 'react'
import Button from 'react-bootstrap/Button';
import userAccount, { IToken, IUserAccount } from '../../utils/userAccount'
import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import onchain, { getTokenToAddData } from '../../utils/onchain';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

interface AddTokenProps {
    currUserAccount : IUserAccount | undefined,
}

const AddToken : React.FC<AddTokenProps> = ({currUserAccount}) => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [tokenToAdd,setTokenToAdd] = useState<IToken>()

    const [showToast, setShowToast] = useState(false);
    const [toastContent,setToastContent] = useState<JSX.Element>();

    const addTokenToCurr = async () => {
        if(tokenToAdd && await onchain.isValidTokenAddress(tokenToAdd.address)) {
            let tokenToAddData = await getTokenToAddData(tokenToAdd.address)
            ////console.log("Here",currUserAccount)
            if(currUserAccount) {
                
                const doesNotExist: boolean = currUserAccount.tokens.every((item:IToken) => item.address !== tokenToAdd.address);

                ////console.log(doesNotExist)

                if(doesNotExist) {
                    currUserAccount.tokens.push(tokenToAddData)
                }
                let userGammaData = await userAccount.getGammaData()
                for(let i = 0 ; i < userGammaData.userAccounts.length;i++) {
                    if(userGammaData.userAccounts[i].address == currUserAccount.address) {
                        userGammaData.userAccounts[i] = currUserAccount
                        userGammaData.userSettings.lastUsedAccount = currUserAccount
                    }
                }
                await userAccount.setGammaData(userGammaData)
                setShow(false)
                setToastContent(<div>Added token</div>)
                setShowToast(true)
                
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
      <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
      <Toast.Header>
        <strong className="me-auto">Add new token</strong>
      </Toast.Header>
      <Toast.Body>{toastContent}</Toast.Body>
    </Toast>
  </ToastContainer>

    <Button variant="primary" style={{position:"absolute",bottom:"50px",width:"270px"}} onClick={handleShow}>
        + Add Token   
        </Button>

        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Token</Modal.Title>
          </Modal.Header>
            <Modal.Body className='newuserpage-modal-content'>
              <p>Add new token to track on your account</p>
              
              <Form className='trade-form'>
    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1" style={{textAlign:"left"}}>
      <Form.Control type="text" placeholder="Enter Token Address" onChange={(e) => setTokenToAdd({
        address:e.target.value,
        decimals:0,
        name:"",
        symbol:"",
      })}/>
      <Form.Check type="checkbox" id="default-checkbox" label="All Accounts" defaultChecked/>

    </Form.Group>
    <Button onClick={addTokenToCurr}>+ Add Token</Button>
  </Form>

            </Modal.Body>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>

    </>
  )
}

export default AddToken