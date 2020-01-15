
import React from 'react';
import ReactDOM from 'react-dom';

import styles from './css/loginregister.css'
import logo from './static/AllistLogo.jpeg'

class Loginregister extends React.Component {

	state = {
		loginNotRegister: true
	}

	signIn() {
		if(!this.state.loginNotRegister) this.setState({ loginNotRegister: true })
	}

	signUp() {
		if(this.state.loginNotRegister) this.setState({ loginNotRegister: false })
	}

	test() {
		this.props.test();
	}

	login = (e) => {
		e.preventDefault()
		const email = e.target.parentElement.parentNode[0].value
		const password = e.target.parentElement.parentNode[1].value
		this.props.login(email, password, false )
	}

	newLogin = (e) => {
		e.preventDefault()
		const email = e.target.parentElement.parentNode[0].value
		const password = e.target.parentElement.parentNode[1].value
		this.props.login(email, password, true )
	}

	register = (e) => {
		e.preventDefault()
		this.props.register(e.target[0].value, e.target[1].value)
	}

	render() {
		const LogoFunc = (props) => {
			return <i className={styles.logo}>ALList</i>
		}

		const Login = (props) => {
			return <form method="post">
						<div className="form-group">
							<input type="text" className={styles.formcontrol} name="username" placeholder="Email"></input>
						</div>
						<div className="form-group">
							<input type="password" className={styles.formcontrol} name="password" placeholder="Password"></input>
						</div>
						<div className={styles.sbmtBtnDiv}>
							<button type="submit" onClick={this.login} className={styles.sbmtBtn}>LOGIN</button>
						</div>
						<div className={styles.sbmtBtnDiv}>
							<button type="submit" onClick={this.newLogin} className={styles.sbmtBtn}>NEW FRONTEND</button>
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
							<button type="submit" className={styles.sbmtBtn}>REGISTER</button>
						</div>
					</form>
		}

		return (
			<div className={styles.back}>
				<div className={styles.center}>
					<div className={styles.btnDiv}>
						<div className={this.state.loginNotRegister ? styles.selectedBtnDiv : styles.unselectedBtnDiv}>
							<button className={styles.inUpSwitch} onClick={this.signIn.bind(this)}>SIGN IN</button>
						</div>
						<div className={!this.state.loginNotRegister ? styles.selectedBtnDiv : styles.unselectedBtnDiv}>
							<button className={styles.inUpSwitch} onClick={this.signUp.bind(this)}>SIGN UP</button>
						</div>
						<div className={styles.testBtnDiv}>
							<button className={styles.inUpSwitch} onClick={this.test.bind(this)}>TEST</button>
						</div>
					</div>
					<div className={styles.content}>
						<img className={styles.logo} src={logo} />
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




