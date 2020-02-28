import React, {useState, useEffect} from 'react';
import Item from './Item'

const ItemContainer = ({items, handleAction}) => {

	useEffect(() => {
		console.log('items', items)
	}, [items])

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
					handleAction={handleAction}
				/>
			)}
		</div>
	)
}

export default ItemContainer;