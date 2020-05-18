import React, {useState, useEffect, useRef} from 'react';

import Bullet from './Bullet.js'
import EditableText from './EditableText.js'
import {createUseStyles} from 'react-jss'

import { ItemTypes } from './Constants';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import _ from 'lodash';
import composeRefs from '@seznam/compose-react-refs'

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
})

const itemSource = {
	beginDrag(props, monitor, component) {
		console.log("beganDrag", props)
		return { id: props.primaryKey, on: props.orderNumber, properties: props }
	}
}

const itemTarget = {
	drop(props, monitor) {
		props.handleReOrder(monitor.getItem().id, monitor.getItem().on, props.primaryKey, props.orderNumber)
	}
}

const sourceCollect = (connect, monitor) => {
	return {
		connectDragSource: connect.dragSource(),
		connectDragPreview: connect.dragPreview(),
		isDragging: monitor.isDragging()
	}
}

const targetCollect = (connect, monitor) => {
	return {
	    connectDropTarget: connect.dropTarget(),
	    isOver: monitor.isOver()
	}
}

const Item = ({item, checked, indentLevel, list, handleAction, reorder}) => {

	const classes = useStyles(indentLevel);

	const [{ isDragging }, drag] = useDrag({
		item: { type: ItemTypes.ITEM, item },
		collect: (monitor) => {
		  return {
			isDragging: monitor.isDragging(),
		  }
		},
		end: (dropResult, monitor) => {
		  const { id: droppedId, item } = monitor.getItem()
		  const didDrop = monitor.didDrop()
		  reorder(item._id, item.orderNumber, monitor.getDropResult().dropTarget._id, monitor.getDropResult().dropTarget.orderNumber)
		},
	  })
	  const [collectedProps, drop] = useDrop({
		accept: ItemTypes.ITEM,
		drop: (i, monitor) => {
			console.log('drop drop', item, monitor.getItem(), monitor.didDrop())
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

//export default _.flow([DragSource(ItemTypes.ITEM, itemSource, sourceCollect), DropTarget(ItemTypes.ITEM, itemTarget, targetCollect)])(AllistItem);