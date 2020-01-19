import React, {useState, useEffect, useRef} from 'react';
import ContentEditable from 'react-contenteditable'
import styles from './css/item.css';

import Bullet from './Bullet.js'

const Item = ({item}) => {

	const contentEditableRef = useRef(null)

	useEffect(() => {
		console.log('items', item)
	}, [item])

	return (
		<div className={styles.item}>
			<Bullet decollapsed={true} checked={true}/>
			<ContentEditable
				className={styles.contentEditableDiv}
				innerRef={contentEditableRef}
				html={item.itemTitle}
				disabled={false}
			/>
		</div>
	)
}

export default Item;