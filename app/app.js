import React, {Fragment, useState, useRef, useEffect} from 'react';
import Entry from './Entry';
import './css/fonts.css';
import jwt_decode from 'jwt-decode';

import WorkFlowy from './WorkFlowy'
import NavBar from './NavBar'

import { usePrevious } from './hooks'

import {
	HashRouter as Router,
	Route,
	Redirect,
	Switch
} from 'react-router-dom'

import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
	'@font-face': {
		fontFamily: 'Arimo',
		src: 'url("./fonts/Arimo/Arimo-Regular.ttf") format("truetype")'
	},
	app: {
		fontFamily: 'Arimo'
	}
})

const App = () => {

	const classes = useStyles();

	const [auth, setAuth] = useState(false)
	const [newFrontEnd, setNewFrontEnd] = useState(false)
	const lastActivityRef = useRef()
	const timerRef = useRef()

	useEffect(() => {
		getAuth();
		maintainEventListener('add', ['mousemove', 'keydown', 'keypress', 'click', 'scroll']);
		lastActivityRef.current = Date.now();
		timerRef.current = setInterval(checkIdleTime(), 60 * 1000);
		return () => {
			maintainEventListener('remove', ['mousemove', 'keydown', 'keypress', 'click', 'scroll']);
			clearInterval(timerRef.current);
		}
	}, [])

	const prevAuth = usePrevious(auth)
	useEffect(() => {
		if(prevAuth !== auth) {
			getAuth()
		}
	}, [auth])

	const updateLastActivity = () => {
		lastActivityRef.current = Date.now();
	};
	
	const maintainEventListener = (action, types) => {
		if(action === 'add') {
			types.forEach(type => {
				window.addEventListener(type, updateLastActivity());
			})
		}
		if(action === 'remove') {
			types.forEach(type => {
				window.removeEventListener(type, updateLastActivity());
			})
		}
	};

	const getAuth = () => {
		const headers = new Headers({'authorization': `Bearer ${localStorage.getItem('access')}`});
		if(localStorage.getItem('access')) {
			fetch('/users/', { headers })
			.then(resp => {
				if(resp.statusText === "OK") {
					setAuth(true)
				}
				else setAuth(false)
				//if(resp.statusText == "Unauthorized") console.log("Unauthorized");
			})
			.catch(function(error) {console.log(error)});
		}
	};

	const refreshAccessToken = () => {
		const data = {
			refreshToken: localStorage.getItem('refresh')
		};
		fetch('/refreshAccessToken/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'authorization': 'Bearer ' + localStorage.getItem('refresh'),
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			return resp.json();
		})
		.then(data => {
			localStorage.setItem('access', data.token.accessToken);
		})
	};

	const handleLogOut = () => {
		localStorage.removeItem('access');
		localStorage.removeItem('refresh');
		setAuth(false)
	}

	const checkIdleTime = () => {
		const dateNowTime = new Date().getTime();
		const lastActiveTime = new Date(lastActivityRef.current).getTime();
		const remTime = Math.floor((dateNowTime - lastActiveTime)/ 1000);
		if(localStorage.getItem('access')){
			const accessToken = localStorage.getItem('access')
			if(jwt_decode(accessToken).exp < Date.now()/1000 + 2 * 60) {
				refreshAccessToken()
			}
		}	
		if(remTime > 60 * 5) {
			localStorage.removeItem('access');
			localStorage.removeItem('refresh');
			setAuth(false)
		}
	};

	const logIn = (username, password, act) => {
		const data = {
			username,
			password
		};
		fetch('/logintoken/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			return resp.json();
		})
		.then(data => {
			localStorage.setItem('access', data.token.accessToken);
			localStorage.setItem('refresh', data.token.refreshToken);
			if(act) {
				setNewFrontEnd(true)
			}
			setAuth(true)
		})
	};

	const register = (username, password) => {
		const data = {
			username,
			password,
		};
		fetch('/registertoken/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			return resp.json();
		})
		.then(data => {
			localStorage.setItem('access', data.token.accessToken);
			localStorage.setItem('refresh', data.token.refreshToken);
			setAuth(true)
		})
	};

	const test = () => {
		const data = {
			username: 'TESTePU3ieiI7X',
			password: 'TESTPWtHUCg3yd'
		};
		fetch('/testtoken/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			return resp.json();
		})
		.then(data => {
			localStorage.setItem('access', data.token.accessToken);
			localStorage.setItem('refresh', data.token.refreshToken);
			setAuth(true)
		})
	};

	const handleTrashCheckedItemsFromNav = () => {
		const self = this
		const fetchData = { 
		    method: 'DELETE', body: JSON.stringify({orderNumber: 0}),
		    headers: new Headers({
		    	'authorization': 'Bearer ' + localStorage.getItem('access'),
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest'
		    })
		}
		fetch('/items/trash/', fetchData)
			.then((data) => {
				//self.setState({updateChild: true})
			});
	}

	const landing = 
		!auth ? (
			<Redirect to={{ pathname: '/login'}}></Redirect>
		) : (
			<Redirect to={{ pathname: '/home'}}></Redirect>
		)

	const entry = () =>
		<Entry
			login={logIn}
			register={register}
			test={test}>
		</Entry>

	const home = () =>
		auth ? 
		<Fragment>
			<NavBar
				trashCheckedItemsFromNav={handleTrashCheckedItemsFromNav}
				logout={handleLogOut} 
			/>
			<WorkFlowy />
		</Fragment>
		:
		<Redirect to={{ pathname: '/login'}}></Redirect>

	return (
			<Router>
				<div className={classes.app}>
					{landing}
					<Switch>
						<Route path='/login' render={entry}></Route>
						<Route path='/home' render={home}></Route>
					</Switch>
				</div>
			</Router>
	)
}

export default App