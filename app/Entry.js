import React, { useState } from 'react';
import logo from './static/AllistLogo.jpeg'
import { createUseStyles } from 'react-jss'

import { Link } from 'react-router-dom'

const useStyles = createUseStyles({
    back: {
        background: '#e2e2e2',
        width: '100%',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    },
    center: {
        borderRadius: '0 0 15px 15px',
        width: '300px',
        backgroundColor: '#fff',
        margin: '96px auto',
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'auto',
        padding: '0 1em 0 1em',
        borderBottom: '2px solid #ccc',
        display: 'table',
        fontFamily: 'Arimo'
    },
    content: {
        display: 'block',
        marginTop: '20%',
        marginBottom: '20%'
    },
    formcontrol: {
        width: '100%',
        fontFamily: 'Arimo',
        fontSize: '20px',
        marginTop: 10
    },
    logo: {
        display: 'block',
        height: '75px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: '40px'
    },
    sbmtBtn: {
        width: '100%',
        background: '#e3e1df',
        color: '#8e8e8e',
        padding: '10px',
        fontFamily: 'Arimo',
        fontSize: '18px'
    },
    sbmtBtnDiv: {
        textAlign: 'center',
        display: 'block',
        marginTop: 10
    },
    btnDiv: {
        textAlign: 'center',
        display: 'block',
        marginTop: -33,
        marginLeft: -16,
        marginRight: -17,
        borderRadius: '10px 10px 0 0'
    },
    selectedBtnDiv: {
        display: 'inline-block',
        width: '33.33333%',
        background: 'white',
        borderRadius: '10px 10px 0 0'
    },
    unselectedBtnDiv: {
        display: 'inline-block',
        width: '33.33333%',
        background: '#B4BCC9',
        borderRadius: '10px 10px 0 0'
    },
    testBtnDiv: {
        display: 'inline-block',
        width: '33.33333%',
        background: '#DADEE4',
        borderRadius: '10px 10px 0 0'
    },
    inUpSwitch: {
        color: '#8e8e8e',
        background: 'transparent',
        borderRadius: '10px',
        width: '100%',
        padding: 10,
        border: 'none',
        fontFamily: 'Arimo',
        fontSize: '18px',
        '&:hover': {
            cursor: 'pointer'
        }
      }
          
})

const Entry = ({login, register, test}) => {

    const classes = useStyles()
    const [ type, setType ] = useState('LOGIN')

    const handleLogin = (e) => {
		e.preventDefault()
		const email = e.target.parentElement.parentNode[0].value
        const password = e.target.parentElement.parentNode[1].value
		login(email, password, false )
    }
    
    const handleNewLogin = (e) => {
		const email = e.target.parentElement.parentNode[0].value
        const password = e.target.parentElement.parentNode[1].value
		login(email, password, true )
    }
    
    const handleRegister = (e) => {
        e.preventDefault()
        const email = e.target.parentElement.parentNode[0].value
        const password = e.target.parentElement.parentNode[1].value
		register(email, password)
    }

    return (
        <div className={classes.back}>
            <div className={classes.center}>
                <div className={classes.btnDiv}>
                    <div className={type === 'LOGIN' ? classes.selectedBtnDiv : classes.unselectedBtnDiv}>
                        <button className={classes.inUpSwitch} onClick={() => setType('LOGIN')}>SIGN IN</button>
                    </div>
                    <div className={type === 'REGISTER' ? classes.selectedBtnDiv : classes.unselectedBtnDiv}>
                        <button className={classes.inUpSwitch} onClick={() => setType('REGISTER')}>SIGN UP</button>
                    </div>
                    <div className={classes.testBtnDiv}>
                        <button className={classes.inUpSwitch} onClick={() => test()}>TEST</button>
                    </div>
                </div>
                <div className={classes.content}>
                    <img className={classes.logo} src={logo} />
                    <div>
                        <form method="post">
                            <div className="form-group">
                                <input type="text" className={classes.formcontrol} name="username" placeholder="Email"></input>
                            </div>
                            <div className="form-group">
                                <input type="password" className={classes.formcontrol} name="password" placeholder="Password"></input>
                            </div>
                            <div className={classes.sbmtBtnDiv}>
                                <button type="submit" onClick={type === 'LOGIN' ? handleLogin : handleRegister} className={classes.sbmtBtn}>{type}</button>
                            </div>
                            <div className={classes.sbmtBtnDiv}>
                                <button type="button" onClick={handleNewLogin} className={classes.sbmtBtn}>NEW FRONTEND</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Entry;