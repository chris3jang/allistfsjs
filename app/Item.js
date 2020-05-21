import React from 'react';

import Bullet from './Bullet.js'
import EditableText from './EditableText.js'
import {createUseStyles} from 'react-jss'

import { ItemTypes } from './Constants';
import _ from 'lodash';

import { useDrag, useDrop } from 'react-dnd';

const useStyles = createUseStyles({
	item: {
		display: 'block',
		marginTop: '10px'
	},
	indent: {
		paddingLeft: val => val * 20
	},
	complete: {
	  textDecoration: 'line-through',
	  opacity: '.2'
	}
});

const Item = ({item, checked, indentLevel, list, handleAction, reorder}) => {

	const classes = useStyles(indentLevel);

	const [, drag] = useDrag({
		item: { type: ItemTypes.ITEM, item },
		collect: (monitor) => {
		  return {
			isDragging: monitor.isDragging(),
		  }
		},
		end: (_dropResult, monitor) => {
		  const { item } = monitor.getItem();
		  const dropTarget = monitor.getDropResult().dropTarget;
		  reorder(item._id, dropTarget.orderNumber)
		},
	})

	const [, drop] = useDrop({
		accept: ItemTypes.ITEM,
		drop: () => {
			return {
				dropTarget: item
			}
		}
	})

	return (
		<div key={item._id} ref={(node) => drag(drop(node))} className={`${classes.item} ${classes.indent} ${checked && classes.complete}`}>
			<Bullet orderNumber={item.orderNumber} decollapsed={item.decollapsed} checked={item.checked} handleAction={handleAction}/>
			<EditableText id={item._id} orderNumber={item.orderNumber} itemTitle={item.itemTitle} checked={item.checked} list={list} handleAction={handleAction}/>
		</div>
	)
}

export default Item;