
import React from 'react';
import ReactDOM from 'react-dom';

import Home from './home'
import Lists from './Lists'
import CurrentList from './CurrentList'
import NavBar from './NavBar'

import Loginregister from './Loginregister'

import styles from './app.css'

import {BrowserRouter, Route, Link} from 'react-router-dom'

import jwt_decode from 'jwt-decode'
import './fonts.css'

class App extends React.Component {

	state = {
		authenticated: false,
		user: null
	}

	checkIdleTime = () => {
		console.log("checkIdleTimex")
		const dateNowTime = new Date().getTime();
		const lastActiveTime = new Date(this.lastActivity).getTime();
		const remTime = Math.floor((dateNowTime - lastActiveTime)/ 1000);
		console.log("Idle since "+remTime+" Seconds Last active at "+ this.lastActivity)

		if(localStorage.getItem('access')){
			const accessToken = localStorage.getItem('access')
			console.log(jwt_decode(accessToken).exp)
			console.log(Date.now()/1000)
			if(jwt_decode(accessToken).exp < Date.now()/1000 + 2 * 60) {
				this.refreshAccessToken()
			}
		}	

		console.log("remTime", remTime)
		if(remTime > 60 * 5) {
			this.handleLogout()
		}

		
	}

	componentDidMount() {
		console.log("did mount")
		this.getAuthentication()
		if(localStorage.getItem('access')) {
			const accessToken = localStorage.getItem('access')
			//console.log(jwt_decode(accessToken))
			console.log(Date.now())
		}

		window.addEventListener('mousemove', this.updateLastActivity)
		window.addEventListener('keydown', this.updateLastActivity)
		window.addEventListener('keypress', this.updateLastActivity)
		window.addEventListener('click', this.updateLastActivity)
		window.addEventListener('scroll', this.updateLastActivity)
		this.lastActivity = Date.now()

		this.timer = setInterval(this.checkIdleTime, 60 * 1000);

		console.log("mount end")

	}

	updateLastActivity = () => {
		//console.log("updateLastActivity")
		this.lastActivity = Date.now()
		//console.log(this.lastActivity)
	}
	
	componentDidUpdate(prevProps, prevState, snapshot) {
		if(prevState.authenticated == this.state.authenticated) this.getAuthentication()
	}

	componentWillUnmount() {
		window.removeEventListener('mousemove', this.updateLastActivity)
		window.removeEventListener('keydown', this.updateLastActivity)
		window.removeEventListener('keypress', this.updateLastActivity)
		window.removeEventListener('click', this.updateLastActivity)
		window.removeEventListener('scroll', this.updateLastActivity)
		clearInterval(this.timer)
	}

	checkIfSessionsOver = () => {
		console.log("ciso")
		if(this.state.authenticated && localStorage.getItem('access')) {
			const accessToken = localStorage.getItem('access')
			if(jwt_decode(accessToken).exp/1000 < Date.now()) {
				this.handleLogout()
			}
		}
	}

	
	refreshAccessToken = () => {
		console.log("refreshAccessToken")
		console.log('localStorage.getItem(refresh)', localStorage.getItem('refresh'))
		const data = {
			refreshToken: localStorage.getItem('refresh')
		}

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
			return resp.json()
		})
		.then(data => {
			console.log("frontend token data: ", data)
			console.log("data.token", data.token)
			localStorage.setItem('access', data.token.accessToken)
		})
	}

	

	getAuthentication = () => {
		const self = this
		const myHeaders = new Headers()
		myHeaders.append('authorization', 'Bearer ' + localStorage.getItem('access'))
		console.log("myHeaders", myHeaders)
		console.log("HERE", localStorage.getItem('access'))
		if(localStorage.getItem('access')) {
			fetch('/users/', {
				headers: myHeaders
			})
			.then(resp => { //resp.statusText either == "OK" or "Unauthorized"
				console.log("then: ", resp)
				if(resp.statusText == "OK") {
					this.setState({ authenticated: true})
				}
				if(resp.statusText == "Unauthorized") console.log("Unauthorized")
			})
			.catch(function(error) {});
		}
	}

	login = (un, pw) => {
		this.setState({user: un})
		const data = {
			username: un,
			password: pw
		}
		fetch('/logintoken/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			return resp.json()
		})
		.then(data => {
			console.log("frontend token data: ", data)
			localStorage.setItem('access', data.token.accessToken)
			localStorage.setItem('refresh', data.token.refreshToken)
			this.setState({ authenticated: true})
			console.log('access token before setState', localStorage.getItem('access'))
		})
	}

	register = (un, pw) => {
		const data = {
			username: un,
			password: pw
		}
		fetch('/registertoken/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			console.log("frontend token resp", resp)
			console.log("fe token resp.body: ", resp.body)
			return resp.json()
		})
		.then(data => {
			console.log("frontend token data: ", data)
			localStorage.setItem('access', data.token.accessToken)
			localStorage.setItem('refresh', data.token.refreshToken)
			this.setState({ authenticated: true})
			console.log('localStorageToken', localStorage.getItem('access'))
		})
	}

	handleLogout = () => {
		console.log("made it to the top")
		localStorage.removeItem('access')
		localStorage.removeItem('refresh')
		this.setState({authenticated: false})
	}

	handleLogin = (un, pw) => {
		this.login(un, pw)
	}

	handleRegister = (un, pw) => {
		this.register(un, pw)
	}


	render() {
		return (
			<div className={styles.app}>
				{this.state.authenticated ? (
					<Home 
						username={this.state.user}
						logout={this.handleLogout.bind(this)}>
					</Home>
				) : (
					<Loginregister
						login={this.handleLogin.bind(this)}
						register={this.handleRegister.bind(this)}>
					</Loginregister>
				)}
			</div>
		)
	}
}

export default App;


