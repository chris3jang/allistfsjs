import React, {useState, useEffect} from 'react';
import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
	dotDiv: {
		display: 'inline-block',
		verticalAlign: 'top',
		height: '12px',
		width: '12px',
		position: 'relative'
	},
	dot: {
		borderRadius: '50%',
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)'
	},
	outer: {
		height: '12px',
		width: '12px'
	},
	mid: {
		height: '8px',
		width: '8px'
	},
	inner: {
		height: '5px',
		width: '5px'
	},
	black: {
		backgroundColor: '#000000',
	},
	white: {
		backgroundColor: '#ffffff',
	},
	hidden: {
		opacity: 0
	}
})

const Bullet = ({orderNumber, decollapsed, checked, handleAction}) => {

	const classes = useStyles()

	const outerBullet = `${classes.dot} ${classes.outer} ${decollapsed ? classes.black : classes.hidden}`
	const midBullet = `${classes.dot} ${classes.mid} ${(decollapsed && !checked) ? classes.white : classes.black}`
	const innerBullet = `${classes.dot} ${classes.inner} ${checked ? classes.black : classes.white}`

	const handleClick = e => {
		handleAction('toggleCheckbox', orderNumber)
	}

	return (
		<div className={classes.dotDiv}>
			<span className={outerBullet}></span>
			<span className={midBullet}></span>
			<span className={innerBullet} onClick={handleClick}></span>
		</div>
	)
}

export default Bullet;