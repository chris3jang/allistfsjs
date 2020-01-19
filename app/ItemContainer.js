import React, {useState, useEffect} from 'react';
import Item from './Item'

const ItemContainer = ({items}) => {

	useEffect(() => {
		console.log('items', items)
	}, [items])

	return (
		<div>
			{items.sort((a, b) => a.orderNumber - b.orderNumber).map(item => 
				<Item
					item={item}
				/>
			)}
		</div>
	)
}

export default ItemContainer;