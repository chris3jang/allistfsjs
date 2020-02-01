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
			if(prevItems.length < items.length) {
				const addedItem = items.find(item => prevItems.findIndex(prevItem => item._id === prevItem._id) === -1)
				itemsRef.current.find(ref => addedItem._id === ref.id).node.focus()
			}
			if(prevItems.length > items.length) {
				console.log('delete')
			}
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
			case 'deleteItem':
				deleteItem(id)
				break;
			case 'editItemTitle': 
				editItemTitle(id, value);
				break;
			case 'toggleCheckbox': {
				toggleCheckbox(id);
				break;
			}
			case 'tabItem': {
				tabItem(id);
				break;
			}
			case 'untabItem': {
				untabItem(id);
				break;
			}
			case 'collapseItem': {
				collapseItem(id);
				break;
			}
			case 'decollapseItem': {
				decollapseItem(id);
				break;
			}
		}	
	}

	//when orderNumber changes to id, we will need orderNumber from data, instead of from state
	const createItem = id => {
		callFetch('createItem', {orderNumber: id}).then(data => {
			const itemsBeforeCreateByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const potentialHiddenItems = itemsBeforeCreateByON.slice(id + 1)//orderNumber + 1
			const areHiddenChildItems = potentialHiddenItems.map(item => item.hidden)
			const numHiddenChildItems = areHiddenChildItems.findIndex(item => !item) === -1 ? 0 : areHiddenChildItems.findIndex(item => !item)
			const newOrderNumber = id + numHiddenChildItems + 1
			//const newOrderNumber = data.orderNumber

			const incrementedItems = items.map(item => {
				if(item.orderNumber >= newOrderNumber) {
					return {
						...item,
						orderNumber: item.orderNumber + 1
					}
				}
				else return item
			})
			const itemsAfterCreate = [
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
			setItems(itemsAfterCreate)
		})
	}

	const createRef = (id, node) => {
		itemsRef.current.push({id, node})
	}

	const deleteItem = id => {
		//change id to orderNumber
		callFetch('deleteItem', {orderNumber: id}).then(data => {
			const itemsBeforeDeleteByON = items.slice().sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToDelete = items.find(item => item.orderNumber === id)

			const firstPotentialChildInd = itemToDelete.orderNumber + 1
			//test for deleting last item
			const potentialChildItems = itemsBeforeDeleteByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToDelete.indentLevel)


			const numChildItems = areItemsChildItems.findIndex(item => !item) === -1 ? 0 : areItemsChildItems.findIndex(item => !item)
			const numNonChildRemainingItems = potentialChildItems.length - numChildItems
			const childItemsToDecrement = itemsBeforeDeleteByON.slice(firstPotentialChildInd, firstPotentialChildInd + numChildItems)
			const childItemsAfterDelete = childItemsToDecrement.map(item => { 
				return {
					...item, 
					orderNumber: item.orderNumber - 1, 
					indentLevel: item.indentLevel - 1
				} 
			})
			const nonChildRemainingItems = itemsBeforeDeleteByON.slice(itemsBeforeDeleteByON.length - numNonChildRemainingItems, itemsBeforeDeleteByON.length)
			const remainingItemsAfterDelete = nonChildRemainingItems.map(item => {
				return {
					...item,
					orderNumber: item.orderNumber - 1
				}
			})
			const unchangedItems = itemsBeforeDeleteByON.filter(item => item.orderNumber < itemToDelete.orderNumber)
			const itemsAfterDelete = [...unchangedItems, ...childItemsAfterDelete, ...remainingItemsAfterDelete]

			setItems(itemsAfterDelete)
		})
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

	const tabItem = id => {
		callFetch('tabItem', {orderNumber: id}).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const tabbedItem = items.find(item => item.orderNumber === id)
			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > tabbedItem.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(item => !item) === -1 ? 0 : areItemsChildItems.findIndex(item => !item)
			const itemsToIncrement = itemsByON.slice(id, firstPotentialChildInd + numChildItems)
			const itemsAfterIncrementing = itemsToIncrement.map(item => {
				return {
					...item,
					indentLevel: item.indentLevel + 1
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < id)
			const remainingItems = itemsByON.filter(item => item.orderNumber > id + numChildItems)
			const itemsAfterTab = [...unchangedItems, ...itemsAfterIncrementing, ...remainingItems]
			setItems(itemsAfterTab)
		})
	}

	const untabItem = id => {
		callFetch('untabItem', {orderNumber: id}).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const untabbedItem = items.find(item => item.orderNumber === id)
			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > untabbedItem.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(item => !item) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(item => !item)
			const itemsToDecrement = itemsByON.slice(id, firstPotentialChildInd + numChildItems)
			const itemsAfterDecrementing = itemsToDecrement.map(item => {
				return {
					...item,
					indentLevel: item.indentLevel - 1
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < id)
			const remainingItems = itemsByON.filter(item => item.orderNumber > id + numChildItems)
			const itemsAfterUntab = [...unchangedItems, ...itemsAfterDecrementing, ...remainingItems]
			setItems(itemsAfterUntab)
		})
	}

	const collapseItem = id => {
		callFetch('collapseItem', {orderNumber: id, decollapsed: true}).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToCollapse = items.find(item => item.orderNumber === id)
			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToCollapse.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(item => !item) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(item => !item)
			const itemsToPotentiallyUnhide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + numChildItems)
			const unhiddenItems = itemsToPotentiallyUnhide.map(item => {
				const potentialParents = itemsByON.filter(i => (i.orderNumber >= id && i.orderNumber < item.orderNumber && i.indentLevel === item.indentLevel - 1))
				const parent = potentialParents.reduce((a, b) => Math.max(a.orderNumber, b.orderNumber))
				if(parent.orderNumber === id || !parent.decollapsed) {
					return {
						...item,
						hidden: false
					}
				}
				else {
					item
				}
			})
			const itemAfterCollapse = {
				...itemToCollapse, decollapsed: false
			}
			const itemsAfterCollapse = [...itemsByON.slice(0, id), itemAfterCollapse, ...unhiddenItems, ...itemsByON.slice(firstPotentialChildInd + numChildItems)]
			setItems(itemsAfterCollapse)

		})
	}

	const decollapseItem = id => {
		callFetch('collapseItem', {orderNumber: id, decollapsed: false}).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToDecollapse = items.find(item => item.orderNumber === id)
			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToDecollapse.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(item => !item) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(item => !item)
			const itemsToHide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + numChildItems)
			const itemsHid = itemsToHide.map(item => {
				return {
					...item,
					hidden: true
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < id)
			const remainingItems = itemsByON.filter(item => item.orderNumber > id + numChildItems)
			const itemAfterDecollapse = {
				...itemToDecollapse, decollapsed: true
			}
			const itemsAfterDecollapse = [...unchangedItems, itemAfterDecollapse, ...itemsHid, ...remainingItems]
			setItems(itemsAfterDecollapse)
		})
	}

	return (
		<ItemContainer items={items} handleAction={handleAction}/>
	)
}

export default WorkFlowy;