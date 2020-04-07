import React, {useState, useEffect} from 'react';
import Item from './Item'

const ItemContainer = ({items, list, handleAction, reorder}) => {

	useEffect(() => {
		console.log('items', items)
	}, [items])

	const listIndentRootLevel = items.reduce((prev, curr) => prev.indentLevel < curr.indentLevel ? prev : curr, 0).indentLevel

	return (
		<div style={{margin: '0% 20%'}}>
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