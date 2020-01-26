import React, {useState, useEffect, useRef} from 'react';
import ContentEditable from 'react-contenteditable'
import styles from './css/item.css';

import Bullet from './Bullet.js'
import EditableText from './EditableText.js'

const Item = ({item, handleAction}) => {

	useEffect(() => {
		console.log('items', item)
	}, [item])

	return (
		<div className={styles.item}>
			<Bullet orderNumber={item.orderNumber} decollapsed={item.decollapsed} checked={item.checked} handleAction={handleAction}/>
			<EditableText id={item._id} orderNumber={item.orderNumber} itemTitle={item.itemTitle} handleAction={handleAction}/>
		</div>
	)
}

export default Item;