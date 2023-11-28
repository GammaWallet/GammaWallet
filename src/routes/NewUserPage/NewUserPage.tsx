import React, { useState } from 'react'
import { Row } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import CreateNewWallet from './CreateNewWallet';
import ImportWallet from './ImportWallet';
import logo from '../../images/logo-no-bg.png'
import favicon1 from '../../images/favicon-16x16.png'
import favicon2 from '../../images/favicon-32x32.png'
import logo2 from '../../images/logo2.svg'

const NewUserPage = () => {

  let temp1 = favicon1
  let temp2 = favicon2

  return (
    <Container>
      <div className='newuserpage-container'>
      <Row>
        <Col>
        <div className='newuserpage-logo-container'><img src={logo2} height={150}></img></div>
        <div className='newuserpage-title'>GammaWallet</div>    
        <div>Non-Custodial Onchain Trading</div>
        <CreateNewWallet></CreateNewWallet>    
        <ImportWallet></ImportWallet>    
        </Col>
        </Row>
        </div>
    </Container>
  )
}

export default NewUserPage