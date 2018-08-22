
import React from 'react';
import ReactDOM from 'react-dom';

import Home from './home'
import Lists from './Lists'
import CurrentList from './CurrentList'
import NavBar from './NavBar'

import styles from './app.css'

import {BrowserRouter, Route, Link} from 'react-router-dom'

import jwt_decode from 'jwt-decode'

/*
const React = require("react")
const ReactDom = require("react-dom")
const AllistItem = require("AllistItem")
*/

class App extends React.Component {

	state = {
		authenticated: false,
		user: null
	}

	componentDidMount() {
		console.log("did mount")
		this.getAuthentication()
		if(localStorage.getItem('access')) {
			const accessToken = localStorage.getItem('access')
			console.log(jwt_decode(accessToken))
			console.log(Date.now())
		}
		console.log("mount end")
	}

	
	componentWillUpdate(nextProps, nextState) {
		console.log("cwu")

		//this.checkIfSessionsOver()
		//if(nextState.authenticated != this.state.authenticated) this.getAuthentication()
	}
	

	componentDidUpdate(prevProps, prevState, snapshot) {
		if(prevState.authenticated == this.state.authenticated) this.getAuthentication()
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
		console.log('localStorage.getItem(refresh)', localStorage.getItem('refresh'))
		const data = {
			refreshToken: localStorage.getItem('refresh')
		}

		fetch('/refreshAccessToken/', {
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
			//if(resp.status == 200)
			console.log("frontend token data: ", data)
			localStorage.setItem('access', data.token.accessToken)
			localStorage.setItem('refresh', data.token.refreshToken)
			//this.setState({ authenticated: true})
			this.setState({ authenticated: true}/*, this.loginSession = this.createLoginSession(60)*/)
		})
	}

	getAuthentication = () => {
		const self = this
		const myHeaders = new Headers()
		myHeaders.append('authorization', 'Bearer ' + localStorage.getItem('access'))
		console.log("myHeaders", myHeaders)
		console.log("HERE", localStorage.getItem('access'))
		if(localStorage.getItem('access')) {
			fetch('http://localhost:8080/users', {
				headers: myHeaders
			})
			.then(resp => { //resp.statusText either == "OK" or "Unauthorized"
				console.log("then: ", resp)
				if(resp.statusText == "OK") {
					this.setState({ authenticated: true})
				}
			})
		}
	}

	createLoginSession = (seconds) => {
		setTimeout(()=>{this.setState({ authenticated: false})}, seconds * 1000)
	}

	timeOut = () => {
		this.refreshAccessToken()
		return
	}

	login = (e) => {
		console.log(e)
		console.log(e.target)
		console.log(e.target[0].value)
		console.log(e.target[1].value)
		e.preventDefault()
		this.setState({user: e.target[1].value})
		const data = {
			username: e.target[0].value,
			password: e.target[1].value
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
			//if(resp.status == 200)
			console.log("frontend token data: ", data)
			localStorage.setItem('access', data.token.accessToken)
			localStorage.setItem('refresh', data.token.refreshToken)
			//this.setState({ authenticated: true})
			//this.setState({ authenticated: true}/*, this.loginSession = this.createLoginSession(60)*/)
			this.setState({ authenticated: true}, () => setTimeout(this.refreshAccessToken(), 10*1000))
		})
	}

	register = (e) => {
		console.log(e.target[0].value)
		console.log(e.target[1].value)
		e.preventDefault()
		const data = {
			username: e.target[0].value,
			password: e.target[1].value
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
			this.setState({ authenticated: true}/*, this.loginSession = this.createLoginSession(60)*/)
			console.log('localStorageToken', localStorage.getItem('access'))
		})
	}
	//

	submit = (e) => {
		console.log(e)
		console.log(e.target)
		console.log(e.target[0].value)
		console.log(e.target[1].value)
		e.preventDefault()
	}	

	handleLogout = () => {
		console.log("made it to the top")
		localStorage.removeItem('access')
		localStorage.removeItem('refresh')
		this.setState({authenticated: false})
	}

	render() {
		return (
			<div>
				{this.state.authenticated ? (
					<Home 
						username={this.state.user}
						logout={this.handleLogout.bind(this)}>
					</Home>
				) : (
					<div>
						<form method="post" onSubmit={this.login}>
							<div className="form-group">
								<label>Email</label>
								<input type="text" className="form-control" name="username"></input>
							</div>
							<div className="form-group">
								<label>Password</label>
								<input type="password" className="form-control" name="password"></input>
							</div>
							<button type="submit" className="btn btn-warning btn-lg">Login</button>
						</form>
						<form method="post" onSubmit={this.register}>
							<div className="form-group">
								<label>Email</label>
								<input type="text" className="form-control" name="username"></input>
							</div>
							<div className="form-group">
								<label>Password</label>
								<input type="password" className="form-control" name="password"></input>
							</div>
							<button type="submit" className="btn btn-warning btn-lg">Register</button>
						</form>
					</div>
				)}
			</div>
		)
	}
}

export default App;


/*
				<BrowserRouter>
					<Route path="" component={Home}></Route>
				</BrowserRouter>
*/


