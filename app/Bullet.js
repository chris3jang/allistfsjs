import React, {useState, useEffect} from 'react';
import styles from './css/bullet.css'

const Bullet = ({orderNumber, decollapsed, checked, handleAction}) => {

	const bigDot = decollapsed ? styles.bigDotBlack : styles.bigDotHidden
	const dot = decollapsed ? (checked ? styles.dotBlack : styles.dotWhite) : styles.dotBlack
	const miniDot = checked ? styles.miniDotBlack : styles.miniDotWhite

	const handleClick = e => {
		handleAction('toggleCheckbox', orderNumber)
	}

	return (
		<div className={styles.dotDiv}>
			<span className={bigDot}></span>
			<span className={dot}></span>
			<span className={miniDot} onClick={handleClick}></span>
		</div>
	)
}

export default Bullet;