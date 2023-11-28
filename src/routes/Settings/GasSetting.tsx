import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import AddAccount from '../BuyToken/AddAccount';
import Form from 'react-bootstrap/Form';
import React, { useEffect, useState } from 'react'
import utils
 from '../../utils/utils';
import userAccount from '../../utils/userAccount';
const GasSetting = () => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [gasMultiplier,setGasMultiplier] = useState<number>()
    const changeGasSettings = async () => {
        if(gasMultiplier && gasMultiplier > 1 ) {
            let userGammaData = await userAccount.getGammaData()
            //console.log(userGammaData)
            if(!userGammaData.userSettings) {
                userGammaData.userSettings = {
                    gasPriceMultiplier : gasMultiplier,
                    lastUsedAccount : userGammaData.userAccounts[0]
                }
            } else {
                userGammaData.userSettings.gasPriceMultiplier = gasMultiplier
            }

            await userAccount.setGammaData(userGammaData)
            handleClose()

        }
    }

    const initGasMultiplier = async() => {
        let userGammaData = await userAccount.getGammaData()
        //console.log(userGammaData,"gas settings")
        let oldVal = userGammaData.userSettings.gasPriceMultiplier
        if(oldVal) {
            setGasMultiplier(oldVal)
        }
    }

    useEffect(() => {
        initGasMultiplier()
    },[])

  return (<>
    <Button onClick={handleShow}>Gas Settings</Button>
    

    <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Gas Settings</Modal.Title>
          </Modal.Header>
            <Modal.Body className='newuserpage-modal-content'>


              <h3>Enter Gas Multiplier</h3>
              <p>Gas Multiplier. You will pay x times the current gas price. If you set it to 1.1 you will pay 10% more than the current gas price. By default gas multiplier is set to 1. So you pay the current gas price</p>
             <p> Current Gas Multiplier : <b>{gasMultiplier}</b></p>
             <b>We do not recommend to make gas multiplier higher than 1.1. With 1.1 you will overpay the current gas price by 10%.</b>
              <Form className='trade-form' onSubmit={changeGasSettings}>
    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1" style={{textAlign:"left"}}>
      <Form.Control type="text" placeholder="Gas Multiplier" autoComplete="off" onChange={(e) => setGasMultiplier(parseFloat(e.target.value))}/>

    </Form.Group>
    
    <Button onClick={changeGasSettings}>Set Gas</Button>
  </Form>
            </Modal.Body>
          <Modal.Footer>
          </Modal.Footer>
        </Modal>
    
</>
  )
}

export default GasSetting