import React from 'react';
import ReactDOM from 'react-dom';
import styles from './css/navbar.css';
import logo from './static/AllistLogo.jpeg'

const NavBar = ({trashCheckedItemsFromNav, logout}) => {
	return (
		<div className={styles.topnav}>
			<nav>
				<img className={styles.logo} src={logo} />
				<div className={styles.buttondiv}>
					<button className={styles.button} onClick={() => trashCheckedItemsFromNav()}>Trash</button>
					<button className={styles.button} onClick={() => logout()}>Logout</button>
				</div>
			</nav>
		</div>
	)
}

export default NavBar;