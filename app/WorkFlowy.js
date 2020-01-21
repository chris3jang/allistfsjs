import React, {useState, useEffect} from 'react';
import ItemContainer from './ItemContainer'

const WorkFlowy = () => {

	const [items, setItems] = useState([])

	useEffect(() => {
		let fetchedData = []
		fetch('/items/', { headers: new Headers({authorization: 'Bearer ' + localStorage.getItem('access')})})
			.then((resp) => resp.json())
			.then((data) => {
				setItems(data)
			})

	}, [])

	const handleAction = (action, id, value) => {
		switch (action) {
			case 'edit': 
				editItemTitle(id, value);
				break
		}	
	}

	const editItemTitle = (id, value) => {
		fetch('/items/', { method: 'PUT', body: JSON.stringify({ title: value, orderNumber: id}),
		    headers: new Headers({
		    	'authorization': 'Bearer ' + localStorage.getItem('access'),
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest',
		    })
		}).then(() => {
			const editedItem = items.find(item => item.orderNumber === id)
			const editedItemInd = items.findIndex(item => item.orderNumber === id)
			editedItem.itemTitle = value
			const editedItems = items
			editedItems[editedItemInd] = editedItem
			setItems(editedItems)
		})
	}

	return (
		<ItemContainer items={items} handleAction={handleAction}/>
	)
}

export default WorkFlowy;