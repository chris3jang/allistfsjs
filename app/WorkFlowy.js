import React, {useState, useEffect, Fragment} from 'react';
import Displayer from './Displayer'
import { callFetch } from './api';

const WorkFlowy = () => {

	const [items, setItems] = useState([])

	useEffect(() => {
		callFetch('fetchInitialData')
			.then((data) => {
				setItems(data)
			})
	}, [])

	const handleAction = (action, id, value) => {
		switch (action) {
			case 'createItem': 
				createItem(id)
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

	const reorder = (draggedPK, draggedON, droppedPK, droppedON) => {
		callFetch('reorder', { id: draggedPK, newOrderNumber: droppedON }).then(data => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const draggedItem = items.find(item => item._id === draggedPK)
			const descendantItems = getDescendantItems(draggedItem._id)
			const droppedItem = items.find(item => item.orderNumber === droppedON)
			const droppedItemDescendants = getDescendantItems(droppedItem._id)
			const lowerRange = (draggedItem.orderNumber < droppedON ? (draggedItem.orderNumber + descendantItems.length + 1) : droppedON)
    		const upperRange = (draggedItem.orderNumber < droppedON ? (droppedON + droppedItemDescendants.length) : (draggedItem.orderNumber - 1))
			const inc = (descendantItems.length+1) * (draggedItem.orderNumber < droppedON ? -1 : 1)
			const itemsToShift = inOrder(items).slice(lowerRange, upperRange + 1)
			const descendantInc = (draggedItem.orderNumber < droppedON ? droppedON - draggedItem.orderNumber - descendantItems.length + droppedItemDescendants.length : droppedON - draggedItem.orderNumber)
			const indLevInc = droppedItem.indentLevel - draggedItem.indentLevel
			const newParent = droppedItem.parent
			const descendantsToReorder = inOrder(items).slice(draggedItem.orderNumber + 1, draggedItem.orderNumber + descendantItems.length + 1)
			const rangeOrderNumbers = [lowerRange, upperRange + 1, draggedItem.orderNumber, draggedItem.orderNumber + descendantItems.length + 1].sort((a, b) => a - b)
			const leftItems = itemsByON.slice(0, rangeOrderNumbers[0])
			const middleItems = itemsByON.slice(rangeOrderNumbers[1], rangeOrderNumbers[2])
			const rightItems = itemsByON.slice(rangeOrderNumbers[3])
			const itemsAfterReorderUnsorted = [
				...leftItems,
				...middleItems,
				...rightItems,
				...itemsToShift.map(item => {
					return {
						...item,
						orderNumber: item.orderNumber + inc
					}
				}),
				...descendantsToReorder.map(item => {
					return {
						...item,
						orderNumber: item.orderNumber + descendantInc,
						indentLevel: item.indentLevel + indLevInc
					}
				}),
				{
					...draggedItem,
					orderNumber: draggedItem.orderNumber + descendantInc,
					indentLevel: draggedItem.indentLevel + indLevInc,
					parent: newParent
				}
			]
			const itemsAfterReorder = inOrder(itemsAfterReorderUnsorted)
			setItems(itemsAfterReorder)
		})
	} 

	//when orderNumber changes to id, we will need orderNumber from data, instead of from state
	const createItem = id => {
		callFetch('createItem', {id}).then(data => {
			const itemCreatedOn = items.find(item => item._id === id)
			console.log('itemCreatedOn', itemCreatedOn)
			const descendantItems = getDescendantItems(itemCreatedOn._id)
			const getNewItemParent = () => {
				const nextItem = items.find(item => item.orderNumber === itemCreatedOn.orderNumber + 1)
				if(!nextItem) {
					return itemCreatedOn.parent
				}
				if(nextItem !== null && nextItem.parent === itemCreatedOn._id && !nextItem.hidden){
					return itemCreatedOn._id
				}
				else {
					return itemCreatedOn.parent
				}
			}
			const numHiddenChildrenToSkip = itemCreatedOn.decollapsed ? descendantItems.length : 0
			const newOrderNumber = itemCreatedOn.orderNumber + numHiddenChildrenToSkip + 1
			console.log('newOrderNumber', newOrderNumber)
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
					orderNumber: newOrderNumber,
					parent: getNewItemParent()
				}
			]
			setItems(itemsAfterCreate)
		})
	}

	const deleteItem = id => {
		callFetch('deleteItem', { id }).then(data => {
			const itemToDelete = items.find(item => item._id === id)
			const itemsBeforeDeleteByON = items.slice().sort((a, b) => a.orderNumber - b.orderNumber)
			const descendantItems = getDescendantItems(itemToDelete._id)
			const numRightItems = itemsBeforeDeleteByON.length - (itemToDelete.orderNumber + descendantItems.length + 1)
			const descendantItemsAfterDelete = descendantItems.map(item => { 
				return {
					...item, 
					orderNumber: item.orderNumber - 1, 
					indentLevel: item.indentLevel - 1
				} 
			})
			const nonChildRemainingItems = itemsBeforeDeleteByON.slice(itemsBeforeDeleteByON.length - numRightItems, itemsBeforeDeleteByON.length)
			const remainingItemsAfterDelete = nonChildRemainingItems.map(item => {
				return {
					...item,
					orderNumber: item.orderNumber - 1
				}
			})
			const unchangedItems = itemsBeforeDeleteByON.filter(item => item.orderNumber < itemToDelete.orderNumber)
			const itemsAfterDelete = [...unchangedItems, ...descendantItemsAfterDelete, ...remainingItemsAfterDelete]
			setItems(itemsAfterDelete)
		})
	}

	const editItemTitle = (id, value) => {
		callFetch('editItemTitle', {title: value, id}).then(() => {
			const editedItem = items.find(item => item._id === id)
			const editedItemInd = items.findIndex(item => item._id === id)
			editedItem.itemTitle = value
			const editedItems = items
			editedItems[editedItemInd] = editedItem
			setItems(editedItems)
		})
		return
	}


	const toggleCheckbox = id => {
		let toggledItem = Object.assign({}, items.find(item => item._id === id))
		const checked = toggledItem.checked ? false : true
		callFetch('toggleCheckbox', { id, checked }).then(() => {
			const toggledItemInd = items.findIndex(item => item.orderNumber === toggledItem.orderNumber)
			let editedItems = items.slice()
			toggledItem.checked = checked
			editedItems[toggledItemInd] = toggledItem
			setItems(editedItems)
		})
		return
	}

	const tabItem = id => {
		callFetch('tabItem', { id }).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToTab = items.find(item => item._id === id)
			const descendantItems = getDescendantItems(itemToTab._id)
			const possibleParents = itemsByON.filter(item => item.parent === itemToTab.parent && item.orderNumber < itemToTab.orderNumber)
			const parent = itemsByON.find(item => item.orderNumber === Math.max(...possibleParents.map(par => par.orderNumber)))
			const itemTabbed = {
				...itemToTab,
				parent: parent ? parent._id : null,
				indentLevel: itemToTab.indentLevel + 1
			}
			const descendantsAfterIncrementing = descendantItems.map(item => {
				return {
					...item,
					indentLevel: item.indentLevel + 1
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < itemToTab.orderNumber)
			const remainingItems = itemsByON.filter(item => item.orderNumber > itemToTab.orderNumber + descendantItems.length)
			const itemsAfterTab = [...unchangedItems, itemTabbed, ...descendantsAfterIncrementing, ...remainingItems]
			setItems(itemsAfterTab)
		})
	}

	const untabItem = id => {
		callFetch('untabItem', { id }).then(() => {
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToUntab = items.find(item => item._id === id)
			const descendantItems = getDescendantItems(itemToUntab._id)
			const highestPrevSibling = items.find(item => item.orderNumber === Math.max(...items.filter(item => item.parent === itemToUntab.parent).map(item => item.orderNumber)))
			let add = 0
			const highestPrevSiblingDescendant = inOrder(getDescendantItems(highestPrevSibling._id)).slice(-1).pop()
			if(highestPrevSiblingDescendant) {
				add = highestPrevSiblingDescendant.orderNumber - (itemToUntab.orderNumber + descendantItems.length)
			}
			else add = highestPrevSibling.orderNumber - (itemToUntab.orderNumber + descendantItems.length)
			const prevParent = items.find(item => itemToUntab.parent === item._id)
			const itemUntabbed = {
				...itemToUntab,
				orderNumber: itemToUntab.orderNumber + add,
				indentLevel: itemToUntab.indentLevel - 1,
				parent: prevParent ? prevParent.parent : null
			}
			const newDescendantItems = descendantItems.map(item => {
				return {
					...item,
					orderNumber: item.orderNumber + add,
					indentLevel: item.indentLevel - 1
				}
			})
			const siblingsToSkip = itemsByON.slice(itemToUntab.orderNumber + descendantItems.length + 1, itemToUntab.orderNumber + descendantItems.length + 1 + add)
			const siblingsToSkipAdjusted = siblingsToSkip.map(item => {
				return {
					...item,
					orderNumber: item.orderNumber - descendantItems.length - 1
				}
			})
			const leftItems = itemsByON.slice(0, itemToUntab.orderNumber)
			const rightItems = itemsByON.slice(itemToUntab.orderNumber + descendantItems.length + siblingsToSkip.length + 1)
			const itemsAfterUntab = [
				...leftItems,
				...siblingsToSkipAdjusted,
				itemUntabbed,
				...newDescendantItems,
				...rightItems
			]
			setItems(itemsAfterUntab)
		})
	}

	const shouldItemRemainHidden = (item, itemToggled, potentialParents) => {
		const parent = potentialParents.find(i => i._id === item.parent)
		if(!parent) {
			return false
		}
		if(parent._id === itemToggled._id) {
			return false
		}
		if(parent.decollapsed) {
			return true
		}
		return shouldItemRemainHidden(parent, itemToggled, potentialParents)
	}

	//actual id, not ordernumber, this one does not need to be fixed
	//should this reusable function set children of an item to hidden, or return the children as hidden???
	//right now it returns the children as hidden
	const getUnhiddenChildItems = id => {
		const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
		const itemToCollapse = items.find(item => item._id === id)
		const itemOrderNumber = itemToCollapse.orderNumber
		const descendantItems = getDescendantItems(itemToCollapse._id)
		const firstPotentialChildInd = itemOrderNumber + 1
		const itemsToPotentiallyUnhide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
		const potentialParents = itemsByON.slice(itemOrderNumber, itemOrderNumber + 1 + descendantItems.length)
		const unhiddenItems = descendantItems.map(item => {
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
		return unhiddenItems
	}

	const collapseItem = id => {
		callFetch('collapseItem', { id, decollapsed: true}).then(() => {
			const itemToCollapse = items.find(item => item._id === id)
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const firstPotentialChildInd = itemToCollapse.orderNumber + 1
			const descendantItems = getDescendantItems(itemToCollapse._id)
			const itemsToPotentiallyUnhide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
			const potentialParents = itemsByON.slice(itemToCollapse.orderNumber, firstPotentialChildInd + descendantItems.length)
			const unhiddenItems = itemsToPotentiallyUnhide.map(item => {
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
			const itemsAfterCollapse = [...itemsByON.slice(0, itemToCollapse.orderNumber), itemAfterCollapse, ...unhiddenItems, ...itemsByON.slice(firstPotentialChildInd + descendantItems.length)]
			setItems(itemsAfterCollapse)
		})
	}

	const decollapseItem = id => {
		callFetch('decollapseItem', { id, decollapsed: false}).then(() => {
			const itemToDecollapse = items.find(item => item._id === id)
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const descendantItems = getDescendantItems(itemToDecollapse._id)
			const firstPotentialChildInd = itemToDecollapse.orderNumber + 1
			const itemsToHide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
			const itemsHid = itemsToHide.map(item => {
				return {
					...item,
					hidden: true
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < itemToDecollapse.orderNumber)
			const remainingItems = itemsByON.filter(item => item.orderNumber > itemToDecollapse.orderNumber + descendantItems.length)
			const itemAfterDecollapse = {
				...itemToDecollapse, decollapsed: true
			}
			const itemsAfterDecollapse = [...unchangedItems, itemAfterDecollapse, ...itemsHid, ...remainingItems]
			setItems(itemsAfterDecollapse)
		})
	}

	//TO UTILS
	//id is not order number, do not fix this one
	const getDescendantItems = id => {
		const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
		const parentItem = items.find(item => item._id === id)
		const parentItemOrderNumber = parentItem ? parentItem.orderNumber : null
		const firstPotentialDesInd = parentItem ? parentItemOrderNumber + 1 : 0
		const potentialDesItems = itemsByON.slice(firstPotentialDesInd)
		const areItemsDesItems = potentialDesItems.map(item => item.indentLevel > (parentItem ? parentItem.indentLevel : 0))
		const numDesItems = areItemsDesItems.findIndex(bool => !bool) === -1 ? areItemsDesItems.length : areItemsDesItems.findIndex(bool => !bool)
		const descendantItems = itemsByON.slice(parentItemOrderNumber + 1, firstPotentialDesInd + numDesItems)
		return descendantItems
	}

	const inOrder = items => {
		return items.sort((a, b) => a.orderNumber - b.orderNumber)
	}

	console.log('WORKFLOWY ALL ITEMS STATE (SORTED): ', inOrder(items))

	return (
		<Fragment>
			<Displayer items={items} handleAction={handleAction} reorder={reorder}/>
		</Fragment>
	)
}

export default WorkFlowy;