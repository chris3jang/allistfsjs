import React, {useState, useEffect, useRef} from 'react';
import ContentEditable from 'react-contenteditable'
import styles from './css/item.css';

import Bullet from './Bullet.js'
import EditableText from './EditableText.js'

const Item = ({item, handleAction}) => {

	useEffect(() => {
		console.log('items', item)
	}, [item])

	const handleTextChange = e => {
		e.stopPropogation()
		if(e.target.value) {
			handleAction('edit', item._id, e.target.value)
		}
	}

	return (
		<div className={styles.item}>
			<Bullet decollapsed={true} checked={true}/>
			<EditableText item={item} handleAction={handleAction}/>
		</div>
	)
}

export default Item;