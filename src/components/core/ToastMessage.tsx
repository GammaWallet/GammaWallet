import Toast from 'react-bootstrap/Toast';
import React, { ReactNode, useState } from 'react';
import ToastContainer from 'react-bootstrap/ToastContainer';


interface ToastProps {
  header : ReactNode | undefined
  message : ReactNode | undefined
}

const ToastMessage : React.FC<ToastProps>  = ({header,message})  => {

  const [show, setShow] = useState(true);

  return (
    <ToastContainer
    className="p-3"
    position="top-start"
    style={{ zIndex: 1 }}
  >
    <Toast onClose={() => setShow(false)} show={show} delay={3000} autohide>
    <Toast.Header>
      <img
        src="holder.js/20x20?text=%20"
        className="rounded me-2"
        alt=""
      />
      <strong className="me-auto">{header}</strong>
      <small>11 mins ago</small>
    </Toast.Header>
    <Toast.Body>{message}</Toast.Body>
  </Toast>
  </ToastContainer>
  )
}

export default ToastMessage