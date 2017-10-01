import React, { Component } from 'react';
import { Navbar, Nav, NavItem, Image} from 'react-bootstrap';

import logo from './logo64x64.png';
import {store} from './DataStore';

export default class MyNavbar extends Component {

  onClick = (e) => {
    console.log("event:", e);
    switch (e) {
        case 1: 
          if (this.props.mapRef === undefined) {
            break;
          }
          store.getOSMData(this.props.mapRef.getBBox());
          break;
    }
  }
  
  
  render() {
    return(
        <Navbar collapseOnSelect onSelect={this.onClick}>
          <Navbar.Header>
            <Navbar.Brand>
              <Image src={logo} />
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            {this.props.children}
            <Nav pullRight>
              <NavItem eventKey={1} >Get OSM data</NavItem>
              <Navbar.Text>
                <Navbar.Link href="https://openbeta.io">About</Navbar.Link>
              </Navbar.Text>
              <Navbar.Text>
                <Navbar.Link href="https://github.com/openbeta">GitHub</Navbar.Link>
              </Navbar.Text>
            </Nav>
          </Navbar.Collapse>
      </Navbar>
    );
  }
}