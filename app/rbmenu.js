
import React from 'react';
import ReactDOM from 'react-dom';
//import AllistItem from './Allistitem';

import { slide as Menu } from 'react-burger-menu'


class RbMenu extends React.Component {

	//state = {}

	showSettings = (e) => {
		e.preventDefault()
	}

	render() {

		const styles = {
			bmBurgerButton: {
				position: 'fixed',
				width: '36px',
				height: '30px',
			},
			bmBurgerBars: {
				color: 'white',
				background: '#808080',
				width: '36px',
				height: '30px',
			},
			bmCrossButton: {
				height: '30px',
				width: '36px',
			},
			bmCross: {
				background: '#808080',
			},
			bmMenu: {
				background: '#f2f2f2',
				width: '100%',
			},
			bmOverlay: {
				background: 'none',
			},
		}

		return (
			 <Menu isOpen={ this.props.isOpen } styles={styles}>
			 	<button></button>
		        <a id="home" className="menu-item" >Home</a>
		        <a id="about" className="menu-item" >About</a>
		        <a id="contact" className="menu-item" >Contact</a>
		        <a onClick={ this.showSettings.bind(this) } className="menu-item--small" href="">Settings</a>
		     </Menu>
		)
	}
}

export default RbMenu;