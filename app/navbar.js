
import React from 'react';
import ReactDOM from 'react-dom';
//import AllistItem from './Allistitem';
import styles from './navbar.css';
import logo from './static/AllistLogo.jpeg'


class NavBar extends React.Component {

	handleTrashButtonClick = () => {
		this.props.trashCheckedItemsFromNav();
	}

	handleLogoutButtonClick = () => {
		this.props.logout();
	}

	render() {
		return (
			<div className={styles.topnav}>
				<nav>
					<img className={styles.logo} src={logo} />
					<div className={styles.buttondiv}>
						<button className={styles.button} onClick={this.handleTrashButtonClick.bind(this)}>Trash</button>
						<button className={styles.button} onClick={this.handleLogoutButtonClick.bind(this)}>Logout</button>
					</div>
				</nav>
			</div>
		)
	}
}

export default NavBar;