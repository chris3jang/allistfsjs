import React from 'react';
import Item from './Item'
import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
	container: {
		display: 'inline-block',
		verticalAlign: 'top'
	}
})

const ItemContainer = ({items, list, handleAction, reorder}) => {

	const classes = useStyles()

	const listIndentRootLevel = items.reduce((prev, curr) => prev.indentLevel < curr.indentLevel ? prev : curr, 0).indentLevel

	return (
		<div className={classes.container}>
			{items.filter(item => !item.hidden).sort((a, b) => a.orderNumber - b.orderNumber).map(item => 
				<Item
					key={item._id}
					item={item}
					itemId={item._id}
					itemTitle={item.itemTitle}
					orderNumber={item.orderNumber}
					checked={item.checked}
					indentLevel={item.indentLevel - listIndentRootLevel}
					list={list}
					handleAction={handleAction}
					reorder={reorder}
				/>
			)}
		</div>
	)
}

export default ItemContainer;