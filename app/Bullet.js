import React, {useState, useEffect} from 'react';
import styles from './css/bullet.css'

const Bullet = ({orderNumber, decollapsed, checked, handleAction}) => {

	const bigDot = decollapsed ? styles.bigDotBlack : styles.bigDotHidden
	const dot = decollapsed ? (checked ? styles.dotBlack : styles.dotWhite) : styles.dotBlack
	const miniDot = checked ? styles.miniDotBlack : styles.miniDotWhite

	return (
		<div className={styles.dotDiv}>
			<span className={bigDot} onClick={handleAction('toggle', orderNumber)}></span>
			<span className={dot}></span>
			<span className={miniDot}></span>
		</div>
	)
}

export default Bullet;