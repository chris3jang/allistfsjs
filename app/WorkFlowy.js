import React, {useState, useEffect, useRef} from 'react';
import ItemContainer from './ItemContainer'
import { callFetch } from './api';
import { usePrevious } from './hooks'

const WorkFlowy = ({username, shouldChildUpdate, updateComplete}) => {

	const [items, setItems] = useState([])
	const [mounted, setMounted] = useState(false)
	const itemsRef = useRef([])


	useEffect(() => {
		callFetch('fetchInitialData')
			.then((data) => {
				console.log('yuh4')
				setItems(data)
				setMounted(true)
			})
	}, [])

	/*
	useEffect(() => {
		console.log('yuh2')
		if(shouldChildUpdate) {
			console.log('yuh3')
			callFetch('fetchInitialData')
				.then((data) => {
					console.log('yuh4')
					setItems(data)
					setMounted(true)
					updateComplete()
				})
		}
	}, [shouldChildUpdate])
	*/

	const prevItems = usePrevious(items)
	useEffect(() => {
		console.log('1')
		if(mounted) {
			if(prevItems.length === items.length - 1) {
				const addedItem = items.find(item => prevItems.findIndex(prevItem => item._id === prevItem._id) === -1)
				itemsRef.current.find(ref => addedItem._id === ref.id).node.focus()
			}
			if(prevItems.length === items.length + 1) {
				console.log('prevItems', prevItems)
				console.log("items", items)
				const deletedItem = prevItems.find(prevItem => items.findIndex(item => prevItem._id === item._id) === -1)
				console.log('deletedItem', deletedItem)
				/*
				const previousItem = items.find(item => item.orderNumber === deletedItem.orderNumber - 1)
				console.log('previousItem', previousItem)
				itemsRef.current.find(ref => previousItem._id === ref.id).node.focus()
				*/

				const itemsAbove = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(0, deletedItem.orderNumber).sort((a, b) => b.orderNumber - a.orderNumber)
				const areItemsAboveHidden = itemsAbove.map(item => item.hidden)
				const numHiddenItemsAbove = areItemsAboveHidden.findIndex(bool => !bool) === -1 ? areItemsAboveHidden.length : areItemsAboveHidden.findIndex(bool => !bool)
				if(deletedItem.orderNumber - numHiddenItemsAbove - 1 >= 0) {
					const itemToFocusOn = items.find(item => item.orderNumber === deletedItem.orderNumber - numHiddenItemsAbove - 1)
					const itemRef = itemsRef.current.find(ref => itemToFocusOn._id === ref.id)
					itemRef.node.focus()
				}
			}
		}
	}, [items])

	const handleAction = (action, id, value) => {
		console.log('4')
		switch (action) {
			case 'createItem': 
				console.log('5')
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
			case 'moveUp': {
				moveUp(id, value);
				break;
			}
			case 'moveDown': {
				moveDown(id, value);
				break;
			}
		}	
	}

	//when orderNumber changes to id, we will need orderNumber from data, instead of from state
	const createItem = id => {
		console.log('6')
		callFetch('createItem', {orderNumber: id}).then(data => {
			console.log('7')
			const itemsBeforeCreateByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const potentialHiddenItems = itemsBeforeCreateByON.slice(id + 1)//orderNumber + 1
			const areHiddenChildItems = potentialHiddenItems.map(item => item.hidden)
			const numHiddenChildItems = areHiddenChildItems.findIndex(bool => !bool) === -1 ? 0 : areHiddenChildItems.findIndex(bool => !bool)
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
			console.log('8')
			setItems(itemsAfterCreate)
		})
	}

	const createRef = (id, node) => {
		const refInd = itemsRef.current.findIndex(ref => ref.id === id)
		if(refInd === -1) {
			itemsRef.current.push({id, node})
		}
		else {
			itemsRef.current.splice(refInd, 1, {id, node})
		}
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


			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? 0 : areItemsChildItems.findIndex(bool => !bool)
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
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? 0 : areItemsChildItems.findIndex(bool => !bool)
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
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
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

	const shouldItemRemainHidden = (item, itemToggled, potentialParents) => {
		console.log('item', item)
		const parent = potentialParents.find(i => i._id === item.parent)
		if(!parent) {
			console.log('!')
			return false
		}
		if(parent._id === itemToggled._id) {
			console.log('@')
			return false
		}
		if(parent.decollapsed) {
			console.log('#')
			return true
		}
		return shouldItemRemainHidden(parent, itemToggled, potentialParents)
	}

	const collapseItem = id => {
		callFetch('collapseItem', {orderNumber: id, decollapsed: true}).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToCollapse = items.find(item => item.orderNumber === id)
			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToCollapse.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
			const itemsToPotentiallyUnhide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + numChildItems)

			const potentialParents = itemsByON.slice(id, id + 1 + numChildItems)

			const unhiddenItems = itemsToPotentiallyUnhide.map(item => {
				/*const potentialParents = itemsByON.filter(i => (i.orderNumber >= id && i.orderNumber < item.orderNumber && i.indentLevel === item.indentLevel - 1))
				console.log('potentialParents', potentialParents)
				const parent = potentialParents.reduce((high, item) => high.orderNumber > item.orderNumber ? high : item)
				console.log('parent', parent)
				*/
				/*
				if(parent.orderNumber === id || !parent.decollapsed) {
					return {
						...item,
						hidden: false
					}
				}
				else {
					return item
				}
				*/
				if(shouldItemRemainHidden(item, itemToCollapse, potentialParents)) {
					return item
				}
				else {
					return {
						...item,
						hidden: false
					}
				}
			})
			const itemAfterCollapse = {
				...itemToCollapse, decollapsed: false
			}
			const itemsAfterCollapse = [...itemsByON.slice(0, id), itemAfterCollapse, ...unhiddenItems, ...itemsByON.slice(firstPotentialChildInd + numChildItems)]
			console.log('itemsAfterCollapse', itemsAfterCollapse)
			setItems(itemsAfterCollapse)

		})
	}

	const decollapseItem = id => {
		callFetch('decollapseItem', {orderNumber: id, decollapsed: false}).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToDecollapse = items.find(item => item.orderNumber === id)
			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToDecollapse.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
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

	const moveUp = id => {
		const itemsAbove = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(0, id).sort((a, b) => b.orderNumber - a.orderNumber)
		const areItemsAboveHidden = itemsAbove.map(item => item.hidden)
		const numHiddenItemsAbove = areItemsAboveHidden.findIndex(bool => !bool) === -1 ? areItemsAboveHidden.length : areItemsAboveHidden.findIndex(bool => !bool)
		if(id - numHiddenItemsAbove - 1 < 0) {
			return
		}
		const itemToFocusOn = items.find(item => item.orderNumber === id - numHiddenItemsAbove - 1)
		const itemRef = itemsRef.current.find(ref => itemToFocusOn._id === ref.id)
		itemRef.node.focus()
	}

	const moveDown = id => {
		const itemsBelow = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(id + 1, items.length)
		const areItemsBelowHidden = itemsBelow.map(item => item.hidden)
		const numHiddenItemsBelow = areItemsBelowHidden.findIndex(bool => !bool) === -1 ? areItemsBelowHidden.length : areItemsBelowHidden.findIndex(bool => !bool)
		if(id + numHiddenItemsBelow + 1 > items.length - 1) {
			return
		}
		const itemToFocusOn = items.find(item => item.orderNumber === id + 1 + numHiddenItemsBelow)
		const itemRef = itemsRef.current.find(ref => itemToFocusOn._id === ref.id)
		itemRef.node.focus()
	}

	console.log('123')
	return (
		<ItemContainer items={items} handleAction={handleAction}/>
	)
}

export default WorkFlowy;