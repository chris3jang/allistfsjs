
import React from 'react';
import ReactDOM from 'react-dom';

import Home from './home'
import Lists from './Lists'
import CurrentList from './CurrentList'
import NavBar from './NavBar'

import styles from './app.css'

import {BrowserRouter, Route, Link} from 'react-router-dom'

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
		this.getAuthentication()
	}

	componentWillUpdate() {
		//this.getAuthentication()
	}

	getAuthentication = () => {
		const self = this
		fetch('http://localhost:8080/users')
			.then(resp => { 
				console.log("then: ", resp)
			})
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
		fetch('/login/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			console.log(resp)
			if(resp.status == 200) {
				this.setState({ authenticated: true})
			}
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
		fetch('/register/', {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
		})
		.then(resp => {
			console.log(resp)
			this.setState({ authenticated: true})
		})
	}

	submit = (e) => {
		console.log(e)
		console.log(e.target)
		console.log(e.target[0].value)
		console.log(e.target[1].value)
		e.preventDefault()
	}	

	render() {
		return (
			<div>
				{this.state.authenticated ? (
					<Home username={this.state.user}></Home>
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


