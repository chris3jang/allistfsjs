import React from 'react';
import logo from './static/AllistLogo.jpeg'
import { createUseStyles } from 'react-jss'

const useStyles = createUseStyles({
	topNav: {
		height: '10%',
		width: '100%',
		backgroundColor: '#2A3139',
		overflow: 'auto'
	},
	logoDiv: {
		display: 'inline-block',
		height: '100%'
	},
	logo: {
		display: 'inline-block',
		height: '100%',
		width: 'auto'
	},
	link: {
		display: 'inline-block',
		color: '#f2f2f2',
		textAlign: 'center',
		padding: '24px',
		textDecoration: 'none',
		fontSize: '17px',
		fontFamily: 'arial',
		fontSize: '26px',
		margin: 'auto',
		color: 'white',
		backgroundColor: 'inherit',
		verticalAlign: 'middle'
	},
	buttonDiv: {
		float: 'right',
		display: 'inline-block',
		fontSize: '16px',
		border: 'none',
		outline: 'none',
		color: 'white',
		backgroundColor: 'inherit',
		fontFamily: 'inherit',
		margin: 0,
		height: '100%',
		fontFamily: 'arial'
	},
	button: {
		display: 'inline-block',
		fontSize: '16px',
		border: 'none',
		outline: 'none',
		color: 'white',
		padding: '14px 16px',
		backgroundColor: 'inherit',
		fontFamily: 'inherit',
		margin: 0,
		height: '100%',
		fontFamily: 'arial',
		'&:hover': {
			backgroundColor: 'grey'
		}
	}
})

const NavBar = ({trashCheckedItemsFromNav, logout}) => {
	const classes = useStyles()
	return (
		<div className={classes.topNav}>
			<nav>
				<img className={classes.logo} src={logo} />
				<div className={classes.buttonDiv}>
					<button className={classes.button} onClick={() => trashCheckedItemsFromNav()}>Trash</button>
					<button className={classes.button} onClick={() => logout()}>Logout</button>
				</div>
			</nav>
		</div>
	)
}

export default NavBar;