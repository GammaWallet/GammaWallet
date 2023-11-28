import { Outlet, Link, NavLink } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

const GammaNavbar = () => {
    return (
        <>
      <Navbar bg="dark" data-bs-theme="dark" className="gammaNav">
        <Container>
        
          <Nav className="me-auto" activeKey={window.location.pathname}>
            <NavLink to="/buy_token" className="nav-link">Buy</NavLink>
            <NavLink to="/sell_token" className="nav-link">Sell</NavLink>
            <NavLink to="/settings" className="nav-link">Settings</NavLink>
          </Nav>
        </Container>
      </Navbar>
    
          <Outlet />
        </>
      )
}

export default GammaNavbar