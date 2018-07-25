
import React from 'react';
import ReactDOM from 'react-dom';
//import AllistItem from './Allistitem';
import styles from './navbar.css';


class NavBar extends React.Component {

	//state = {}

	handleEditButtonClick = () => {
		this.props.editListsFromNav()
	}

	handleTrashButtonClick = () => {
		this.props.trashCheckedItemsFromNav()
	}

	render() {
		return (
			<div className={styles.topnav}>
				<div>
					<i><a className={styles.logodiv} href='#'>ALList</a></i>
				</div>
				<div className={styles.buttondiv}>
					<button className={styles.button} onClick={this.handleEditButtonClick.bind(this)}>Edit</button>
					<button className={styles.button} onClick={this.handleTrashButtonClick.bind(this)}>Trash</button>
				</div>
			</div>
		)
	}
}

export default NavBar;