import React, {useState, useEffect, useRef} from 'react';
import ItemContainer from './ItemContainer'
import { callFetch } from './api';
import { usePrevious } from './hooks'

const WorkFlowy = () => {

	const [items, setItems] = useState([])
	const [mounted, setMounted] = useState(false)
	const itemsRef = useRef([])

	useEffect(() => {
		callFetch('fetchInitialData')
			.then((data) => {
				setItems(data)
				setMounted(true)
			})
	}, [])

	const prevItems = usePrevious(items)
	useEffect(() => {
		if(mounted) {
			const addedItem = items.find(item => prevItems.findIndex(prevItem => item._id === prevItem._id) === -1)
			itemsRef.current.find(ref => addedItem._id === ref.id).node.focus()
		}
	}, [items])

	const handleAction = (action, id, value) => {
		switch (action) {
			case 'createItem': 
				createItem(id)
				break;
			case 'createRef':
				createRef(id, value)
				break;
			case 'editItemTitle': 
				editItemTitle(id, value);
				break;
			case 'toggleCheckbox': {
				toggleCheckbox(id);
				break;
			}
		}	
	}

	//when orderNumber changes to id, we will need orderNumber from data, instead of from state
	const createItem = id => {
		callFetch('createItem', {orderNumber: id}).then(data => {
			let newOrderNumber = id + 1
			while(items.find(item => item.orderNumber === newOrderNumber) && items.find(item => item.orderNumber === newOrderNumber).hidden) {
				newOrderNum++
			}
			const incrementedItems = items.map(item => {
				if(item.orderNumber >= newOrderNumber) {
					return {
						...item,
						orderNumber: item.orderNumber + 1
					}
				}
				else return item
			})
			const itemsWithNew = [
				...incrementedItems, 
				{
					_id: data._id, 
					itemTitle: '', 
					indentLevel: data.indentLevel, 
					decollapsed: false, 
					hidden: false, 
					orderNumber: newOrderNumber
				}
			]
			setItems(itemsWithNew)
		})
	}

	const createRef = (id, node) => {
		itemsRef.current.push({id, node})
	}

	const editItemTitle = (id, value) => {
		callFetch('editItemTitle', {title: value, orderNumber: id}).then(() => {
			const editedItem = items.find(item => item.orderNumber === id)
			const editedItemInd = items.findIndex(item => item.orderNumber === id)
			editedItem.itemTitle = value
			const editedItems = items
			editedItems[editedItemInd] = editedItem
			setItems(editedItems)
		})
		return
	}


	const toggleCheckbox = id => {
		let toggledItem = Object.assign({}, items.find(item => item.orderNumber === id))
		const checked = toggledItem.checked ? false : true
		callFetch('toggleCheckbox', { orderNumber: id, checked: checked }).then(() => {
			const toggledItemInd = items.findIndex(item => item.orderNumber === id)
			let editedItems = items.slice()
			toggledItem.checked = checked
			editedItems[toggledItemInd] = toggledItem

			setItems(editedItems)
		})
		return
	}

	return (
		<ItemContainer items={items} handleAction={handleAction}/>
	)
}

export default WorkFlowy;