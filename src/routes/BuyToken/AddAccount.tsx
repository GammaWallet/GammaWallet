import React, { MouseEventHandler } from 'react'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { IUserAccount } from '../../utils/userAccount';
import utils from '../../utils/utils';


interface AddAccountProps {
    addNewAccount:MouseEventHandler<HTMLElement> | undefined,
    userAccounts:Array<IUserAccount> | undefined,
    changeAccount:(data:IUserAccount) => void
}

const AddAccount : React.FC<AddAccountProps> = ({addNewAccount,userAccounts,changeAccount}) => {
  return (
    <DropdownButton id="dropdown-item-button" title="Account" style={{marginBottom:"10px"}}>
    <Dropdown.Item as="button" onClick={addNewAccount}>+ Add Account</Dropdown.Item>
      {userAccounts?.map((obj) => (<Dropdown.Item onClick={() => changeAccount(obj)} as="button">{utils.TruncatedText(obj.address,15)}</Dropdown.Item>))}
      
    </DropdownButton>
  )
}

export default AddAccount