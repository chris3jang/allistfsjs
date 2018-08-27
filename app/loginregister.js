
import React from 'react';
import ReactDOM from 'react-dom';
import AllistItem from './Allistitem'
import Lists from './Lists'
import CurrentList from './CurrentList'
import NavBar from './NavBar'

import styles from './loginregister.css'

class Loginregister extends React.Component {

	state = {
		loginNotRegister: true
	}

	signIn() {
		console.log("signIn")
		if(!this.state.loginNotRegister) this.setState({ loginNotRegister: true })
	}

	signUp() {
		console.log("signUp")
		if(this.state.loginNotRegister) this.setState({ loginNotRegister: false })
	}


	render() {
		const LogoFunc = (props) => {
			return <i className={styles.logo}>ALList</i>
		}

		const Login = (props) => {
			return <form method="post" onSubmit={this.login}>
						<div className="form-group">
							<input type="text" className={styles.formcontrol} name="username" placeholder="Email"></input>
						</div>
						<div className="form-group">
							<input type="password" className={styles.formcontrol} name="password" placeholder="Password"></input>
						</div>
						<div className={styles.sbmtBtnDiv}>
							<button type="submit" className={styles.sbmtBtn}>Login</button>
						</div>
					</form>
		}

		const Register = (props) => {
			return <form method="post" onSubmit={this.register}>
						<div className="form-group">
							<label className={styles.formLabels}>Email</label>
							<input type="text" className={styles.formcontrol} name="username" placeholder="Email"></input>
						</div>
						<div className="form-group">
							<label className={styles.formLabels}>Password</label>
							<input type="password" className={styles.formcontrol} name="password" placeholder="Password"></input>
						</div>
						<div className={styles.sbmtBtnDiv}>
							<button type="submit" className={styles.sbmtBtn}>Register</button>
						</div>
					</form>
		}

		return (
			<div className={styles.back}>
				<div className={styles.center}>
					<div className={styles.btnDiv}>
						<div className={this.state.loginNotRegister ? styles.selectedBtnDiv : styles.unselectedBtnDiv}>
							<button className={styles.inUpSwitch} onClick={this.signIn.bind(this)}>Sign In</button>
						</div>
						<div className={!this.state.loginNotRegister ? styles.selectedBtnDiv : styles.unselectedBtnDiv}>
							<button className={styles.inUpSwitch} onClick={this.signUp.bind(this)}>Sign Up</button>
						</div>
					</div>
					<div className={styles.content}>
						<LogoFunc></LogoFunc>
						<div>
							{this.state.loginNotRegister ? (
								<Login></Login>
							) : (
								<Register></Register>
							)}
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default Loginregister;




