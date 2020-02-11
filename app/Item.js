import React, {useState, useEffect, useRef} from 'react';
import ContentEditable from 'react-contenteditable'
import styles from './css/item.css';

import Bullet from './Bullet.js'
import EditableText from './EditableText.js'

const Item = ({item, checked, handleAction}) => {
	return (
		<div style={{paddingLeft: 20 * item.indentLevel}} className={checked ? styles.itemCompleted : styles.item}>
			<Bullet orderNumber={item.orderNumber} decollapsed={item.decollapsed} checked={item.checked} handleAction={handleAction}/>
			<EditableText id={item._id} orderNumber={item.orderNumber} itemTitle={item.itemTitle} checked={item.checked} handleAction={handleAction}/>
		</div>
	)
}

export default Item;