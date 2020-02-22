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
		const headers = new Headers({'authorization': `Bearer${localStorage.getItem('access')}`});
		if(localStorage.getItem('access')) {
			fetch('/users/', { headers })
			.then(resp => {
				if(resp.statusText === "OK") {
					setAuth(true)
				}
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
				console.log('yuhhh')
				//self.setState({updateChild: true})
			});
	}

	return (
		<JssProvider registry={sheets}>
			<div className={styles.app}>
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
			</div>
		</JssProvider>
	)



}

export default App