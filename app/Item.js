import React, {useState, useEffect, useRef} from 'react';

import Bullet from './Bullet.js'
import EditableText from './EditableText.js'
import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
	indentation: {
		paddingLeft: item => item.indentLevel * 20
	},
	unfinished: {
		marginTop: '10px'
	},
	complete: {
	  marginTop: '10px',
	  textDecoration: 'line-through',
	  opacity: '.2'
	}
})

const Item = ({item, checked, handleAction}) => {
	const classes = useStyles(item);
	return (
		<div className={`${classes.indentation} ${checked ? classes.complete : classes.unfinished}`}>
			<Bullet orderNumber={item.orderNumber} decollapsed={item.decollapsed} checked={item.checked} handleAction={handleAction}/>
			<EditableText id={item._id} orderNumber={item.orderNumber} itemTitle={item.itemTitle} checked={item.checked} handleAction={handleAction}/>
		</div>
	)
}

export default Item;