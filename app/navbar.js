
import React from 'react';
import ReactDOM from 'react-dom';
//import AllistItem from './Allistitem';
import styles from './navbar.css';


class NavBar extends React.Component {

	//state = {}


	//<button className={styles.button} onClick={this.handleEditButtonClick.bind(this)}>Edit</button>
	/*
	handleEditButtonClick = () => {
		this.props.editListsFromNav()
	}
	*/

	handleTrashButtonClick = () => {
		this.props.trashCheckedItemsFromNav()
	}

	handleLogoutButtonClick = () => {
		this.props.logout()
	}

	render() {
		return (
			<div className={styles.topnav}>
				<div className={styles.logodiv}>
					<a className={styles.a} href='#'><i>ALList</i></a>
				</div>
				<div className={styles.buttondiv}>
					<button className={styles.button} onClick={this.handleTrashButtonClick.bind(this)}>Trash</button>
					<button className={styles.button} onClick={this.handleLogoutButtonClick.bind(this)}>Logout</button>
				</div>
			</div>
		)
	}
}

export default NavBar;