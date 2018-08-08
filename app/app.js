
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
		redirectToReferrer: false
	}

	login = (e) => {
		console.log(e.target[0].value)
		console.log(e.target[1].value)
		const data = {
			email: e.target[0].value,
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

		this.setState({ redirectToReferrer: true})
	}




	render() {

		return (
			<div>
				{/*)
				<BrowserRouter>
					<Route path="" component={Home}></Route>
				</BrowserRouter>
				*/}
				<form action="/" method="post" onSubmit={this.login}>
					<div className="form-group">
						<label>Email</label>
						<input type="text" className="form-control" name="email"></input>
					</div>
					<div className="form-group">
						<label>Password</label>
						<input type="password" className="form-control" name="password"></input>
					</div>
					<button type="submit" className="btn btn-warning btn-lg">Login</button>
					<button type="submit" className="btn btn-warning btn-lg">Register</button>
				</form>
			</div>
		)
	}
}

export default App;




