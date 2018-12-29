
import React from 'react';
import ReactDOM from 'react-dom';
import Home from './home';
import Loginregister from './Loginregister';
import styles from './app.css';
import './fonts.css';
import jwt_decode from 'jwt-decode';

class App extends React.Component {

	state = {
		authenticated: false,
		user: null
	};

	componentDidMount() {
		this.getAuth();
		this.maintainEventListener('add', ['mousemove', 'keydown', 'keypress', 'click', 'scroll']);
		this.lastActivity = Date.now();
		this.timer = setInterval(this.checkIdleTime, 60 * 1000);
	}
	
	componentDidUpdate(prevProps, prevState, snapshot) {
		if(prevState.authenticated == this.state.authenticated) this.getAuth();
	}

	componentWillUnmount() {
		this.maintainEventListener('remove', ['mousemove', 'keydown', 'keypress', 'click', 'scroll']);
		clearInterval(this.timer);
	}

	maintainEventListener = (action, types) => {
		if(action === 'add') {
			types.forEach(type => {
				window.addEventListener(type, this.updateLastActivity);
			})
		}
		if(action === 'remove') {
			types.forEach(type => {
				window.removeEventListener(type, this.updateLastActivity);
			})
		}
	};

	getAuth = () => {
		const myHeaders = new Headers();
		myHeaders.append('authorization', 'Bearer ' + localStorage.getItem('access'));
		if(localStorage.getItem('access')) {
			fetch('/users/', {
				headers: myHeaders
			})
			.then(resp => {
				if(resp.statusText == "OK") {
					this.setState({ authenticated: true});
				}
				//if(resp.statusText == "Unauthorized") console.log("Unauthorized");
			})
			.catch(function(error) {console.log(error)});
		}
	};

	updateLastActivity = () => {
		this.lastActivity = Date.now();
	};

	checkIdleTime = () => {
		const dateNowTime = new Date().getTime();
		const lastActiveTime = new Date(this.lastActivity).getTime();
		const remTime = Math.floor((dateNowTime - lastActiveTime)/ 1000);
		if(localStorage.getItem('access')){
			const accessToken = localStorage.getItem('access')
			if(jwt_decode(accessToken).exp < Date.now()/1000 + 2 * 60) {
				this.refreshAccessToken()
			}
		}	
		if(remTime > 60 * 5) {
			this.handleLogOut;
		}
	};
	
	refreshAccessToken = () => {
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

	logIn = (un, pw) => {
		this.setState({user: un});
		const data = {
			username: un,
			password: pw
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
			this.setState({ authenticated: true});
		})
	};

	register = (un, pw) => {
		const data = {
			username: un,
			password: pw
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
			this.setState({ authenticated: true});
		})
	};

	handleLogOut = () => {
		localStorage.removeItem('access');
		localStorage.removeItem('refresh');
		this.setState({authenticated: false});
	};

	handleLogIn = (un, pw) => {
		this.logIn(un, pw);
	};

	handleRegister = (un, pw) => {
		this.register(un, pw);
	};


	render() {
		return (
			<div className={styles.app}>
				{this.state.authenticated ? (
					<Home 
						username={this.state.user}
						logout={this.handleLogOut.bind(this)}>
					</Home>
				) : (
					<Loginregister
						login={this.handleLogIn.bind(this)}
						register={this.handleRegister.bind(this)}>
					</Loginregister>
				)}
			</div>
		)
	}
}

export default App;


