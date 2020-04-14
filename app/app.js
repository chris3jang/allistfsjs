import React, {Fragment, useState, useRef, useEffect} from 'react';
import Home from './home';
import Entry from './Entry';
import styles from './css/app.css';
import './css/fonts.css';
import jwt_decode from 'jwt-decode';

import WorkFlowy from './WorkFlowy'
import NavBar from './NavBar'

import jss from 'jss';
import preset from 'jss-preset-default';
import { SheetsRegistry, JssProvider } from 'react-jss';

import { usePrevious } from './hooks'

import {
	BrowserRouter as Router,
	Route,
	Link,
	Redirect,
	Switch
} from 'react-router-dom'

const setupJss = () => {
	jss.setup(preset());
  
	const sheetsRegistry = new SheetsRegistry();
  
	const globalStyleSheet = jss.createStyleSheet(
	  {'@global': { body: { margin: 0 }}}
	).attach();
  
	sheetsRegistry.add(globalStyleSheet);
  
	return sheetsRegistry;
}
  
const sheets = setupJss();

const App = () => {

	const [auth, setAuth] = useState(false)
	const [username, setUsername] = useState(null)
	const [newFrontEnd, setNewFrontEnd] = useState(false)
	const lastActivityRef = useRef()
	const timerRef = useRef()

	useEffect(() => {
		console.log('get Auth cDM')
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
			console.log('get Auth cDU')
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
		console.log('getAuth auth as state before fetching', auth, localStorage.getItem('access'))
		const headers = new Headers({'authorization': `Bearer ${localStorage.getItem('access')}`});
		if(localStorage.getItem('access')) {
			fetch('/users/', { headers })
			.then(resp => {
				console.log('resp', resp)
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
		console.log('handleLogOut')
		localStorage.removeItem('access');
		localStorage.removeItem('refresh');
		setAuth(false)
		console.log('auth after setting false', auth)
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
		setUsername(username)
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
			console.log('logged in', 'access ', data.token.accessToken, 'refresh ', data.token.refreshToken)
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
				console.log('trashed')
				//self.setState({updateChild: true})
			});
	}

	const entry = () =>
		<Entry
			login={logIn}
			register={register}
			test={test}>
		</Entry>

	const home = () =>
		<Fragment>
			<NavBar
				trashCheckedItemsFromNav={handleTrashCheckedItemsFromNav}
				logout={handleLogOut} 
			/>
			<WorkFlowy />
		</Fragment>


	const test1 = () => <div>LANDING</div>
	const test2 = () => <div>LOGIN</div>
	const test3 = () => <div>HOME</div>

	const landing = 
		!auth ? (
			<Redirect to={{ pathname: '/login'}}></Redirect>
		) : (
			<Redirect to={{ pathname: '/home'}}></Redirect>
		)

	return (
		<JssProvider registry={sheets}>
			<Router>
				<div className={styles.app}>
						{landing}
						<Switch>
							<Route path='/login' render={entry}></Route>
							<Route exact path='/' render={test1}></Route>
							<Route path='/home' render={home}></Route>
						</Switch>
					{/*
						{auth && newFrontEnd ? (
							<Fragment>
								<NavBar
									trashCheckedItemsFromNav={handleTrashCheckedItemsFromNav}
									logout={handleLogOut} 
								/>
								<WorkFlowy />
							</Fragment>
						) : auth ? (
							<Home 
								username={username}
								logout={handleLogOut}>
							</Home>
						) : (
							<Entry
								login={logIn}
								register={register}
								test={test}>
							</Entry>
						)}
					*/}
				</div>
			</Router>
		</JssProvider>
	)



}

export default App