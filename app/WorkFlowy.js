import React, {useState, useEffect, useRef, Fragment} from 'react';
import ItemContainer from './ItemContainer'
import BreadCrumbs from './BreadCrumbs'
import { callFetch } from './api';
import { usePrevious } from './hooks'

import { createUseStyles } from 'react-jss'

const useStyles = createUseStyles({
	'@font-face': {
		fontFamily: 'Arimo',
		src: 'url("./fonts/Arimo/Arimo-Regular.ttf") format("truetype")'
	},
	arimo: {
		fontFamily: 'Arimo'
	}
})

const WorkFlowy = () => {

	const classes = useStyles()

	const [items, setItems] = useState([])
	const [list, setList] = useState(null)
	const [itemToFocus, setFocus] = useState()
	const [mounted, setMounted] = useState(false)
	const itemsRef = useRef([])


	useEffect(() => {
		callFetch('fetchInitialData')
			.then((data) => {
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
		if(mounted) {
			if(prevItems.length === items.length - 1) {
				const addedItem = items.find(item => prevItems.findIndex(prevItem => item._id === prevItem._id) === -1)
				itemsRef.current.find(ref => addedItem._id === ref.id).node.focus()
			}
			if(prevItems.length === items.length + 1) {
				const deletedItem = prevItems.find(prevItem => items.findIndex(item => prevItem._id === item._id) === -1)
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

	useEffect(() => {
		if(itemToFocus) {
			const itemRef = itemsRef.current.find(ref => ref.id === itemToFocus)
			itemRef.node.focus()
		}
	}, [itemToFocus])

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
			case 'moveUp': {
				moveUp(id, value);
				break;
			}
			case 'moveDown': {
				moveDown(id, value);
				break;
			}
			case 'enterChild': {
				enterChild(id, value)
				break;
			}
			case 'returnToParent': {
				returnToParent(value)
				break;
			}
		}	
	}

	const reorder = (draggedPK, draggedON, droppedPK, droppedON) => {
		callFetch('reorder', { id: draggedPK, newOrderNumber: droppedON }).then(data => {
			console.log('reorder in workflowy post fetch')
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const draggedItem = items.find(item => item._id === draggedPK)
			const descendantItems = getDescendantItems(draggedItem._id)
			const droppedItem = items.find(item => item.orderNumber === droppedON)
			const droppedItemDescendants = getDescendantItems(droppedItem._id)
			const lowerRange = (draggedItem.orderNumber < droppedON ? (draggedItem.orderNumber + descendantItems.length + 1) : droppedON)
    		const upperRange = (draggedItem.orderNumber < droppedON ? (droppedON + droppedItemDescendants.length) : (draggedItem.orderNumber - 1))
			const inc = (descendantItems.length+1) * (draggedItem.orderNumber < droppedON ? -1 : 1)
			console.log('lowerRange', lowerRange)
			console.log('upperRange', upperRange)
			console.log('inc', inc)
			const itemsToShift = inOrder(items).slice(lowerRange, upperRange + 1)
			console.log('itemsToShift', itemsToShift)
			const descendantInc = (draggedItem.orderNumber < droppedON ? droppedON - draggedItem.orderNumber - descendantItems.length + droppedItemDescendants.length : droppedON - draggedItem.orderNumber)
			const indLevInc = droppedItem.indentLevel - draggedItem.indentLevel
			const newParent = droppedItem.parent
			console.log('descendantInc', descendantInc)
			console.log('indLevInc', indLevInc)
			console.log('newParent', newParent)
			const descendantsToReorder = inOrder(items).slice(draggedItem.orderNumber + 1, draggedItem.orderNumber + descendantItems.length + 1)
			console.log('descendantsToReorder', descendantsToReorder)
			console.log('other ranges', draggedItem.orderNumber, draggedItem.orderNumber + descendantItems.length + 1)
			const rangeOrderNumbers = [lowerRange, upperRange + 1, draggedItem.orderNumber, draggedItem.orderNumber + descendantItems.length + 1].sort((a, b) => a - b)
			console.log('rangeOrderNumbers', rangeOrderNumbers)
			const leftItems = itemsByON.slice(0, rangeOrderNumbers[0])
			const middleItems = itemsByON.slice(rangeOrderNumbers[1], rangeOrderNumbers[2])
			const rightItems = itemsByON.slice(rangeOrderNumbers[3])
			console.log('leftItems', leftItems)
			console.log('middleItems', middleItems)
			console.log('rightItems', rightItems)

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
			console.log('itemsAfterReorderUnsorted', itemsAfterReorderUnsorted)
			const itemsAfterReorder = inOrder(itemsAfterReorderUnsorted)
			console.log('itemsAfterReorder', itemsAfterReorder)
			setItems(itemsAfterReorder)
		})
	} 

	//when orderNumber changes to id, we will need orderNumber from data, instead of from state
	const createItem = id => {
		callFetch('createItem', {id}).then(data => {
			const itemCreatedOn = items.find(item => item._id === id)
			const descendantItems = getDescendantItems(itemCreatedOn._id)
			/*
			const itemsBeforeCreateByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			console.log('itemsBeforeCreateByON', itemsBeforeCreateByON)
			const potentialHiddenItems = itemsBeforeCreateByON.slice(id + 1)//orderNumber + 1
			console.log('potentialHiddenItems', potentialHiddenItems)
			const areHiddenChildItems = potentialHiddenItems.map(item => item.hidden)
			console.log('areHiddenChildItems', areHiddenChildItems)
			const numHiddenChildItems = areHiddenChildItems.findIndex(bool => !bool) === -1 ? 0 : areHiddenChildItems.findIndex(bool => !bool)
			console.log('numHiddenChildItems', numHiddenChildItems)
			*/

			//calc new item parent
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

			const newOrderNumber = itemCreatedOn.orderNumber + descendantItems.length + 1
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
			console.log('itemsAfterCreate', itemsAfterCreate)
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
			/*
			const tabbedItem = items.find(item => item.orderNumber === id)
			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > tabbedItem.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? 0 : areItemsChildItems.findIndex(bool => !bool)
			*/
			//const itemsToIncrement = itemsByON.slice(id, firstPotentialChildInd + numChildItems)

			const possibleParents = itemsByON.filter(item => item.parent === itemToTab.parent && item.orderNumber < itemToTab.orderNumber)
			console.log('possibleParents', possibleParents)
			const parent = itemsByON.find(item => item.orderNumber === Math.max(...possibleParents.map(par => par.orderNumber)))

			console.log('parent', parent)
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
			console.log('highestPrevSibling', highestPrevSibling)
			let add = 0
			const highestPrevSiblingDescendant = inOrder(getDescendantItems(highestPrevSibling._id)).slice(-1).pop()
			console.log('highestPrevSiblingDescendant', highestPrevSiblingDescendant)
			if(highestPrevSiblingDescendant) {
				add = highestPrevSiblingDescendant.orderNumber - (itemToUntab.orderNumber + descendantItems.length)
			}
			else add = highestPrevSibling.orderNumber - (itemToUntab.orderNumber + descendantItems.length)
			console.log('add', add)

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
			console.log('leftItems', leftItems)
			console.log('siblingsToSkipAdjusted', siblingsToSkipAdjusted)
			console.log('itemUntabbed', itemUntabbed)
			console.log('newDescendantItems', newDescendantItems)
			console.log('rightItems', rightItems)
			const itemsAfterUntab = [
				...leftItems,
				...siblingsToSkipAdjusted,
				itemUntabbed,
				...newDescendantItems,
				...rightItems
			]



			/*
			const itemUntabbed = {
				...itemToUntab,
				parent:  'parent',
				indentLevel: itemToUntab.indentLevel - 1
			}

			const firstPotentialChildInd = id + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToUntab.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
			const itemsToDecrement = itemsByON.slice(id, firstPotentialChildInd + numChildItems)
			console.log('itemsToDecrement', itemsToDecrement)

			const itemsAfterDecrementing = itemsToDecrement.map(item => {
				return {
					...item,
					indentLevel: item.indentLevel - 1
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < untabbedItem.orderNumber)
			const remainingItems = itemsByON.filter(item => item.orderNumber > untabbedItem.orderNumber + numChildItems)
			const itemsAfterUntab = [...unchangedItems, ...itemsAfterDecrementing, ...remainingItems]
			*/
			console.log('itemsAfterUntab', itemsAfterUntab)
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
		/*
		const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
		const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToCollapse.indentLevel)
		const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
		*/
		const itemsToPotentiallyUnhide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
		console.log('itemsToPotentiallyUnhide', itemsToPotentiallyUnhide)
		console.log('descendantItems', getDescendantItems(itemToCollapse._id))
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

			/*
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToCollapse.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
			*/

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

			/*
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToDecollapse.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
			*/

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

	const moveUp = id => {
		const itemToMoveFrom = items.find(item => item._id === id)

		const itemsAbove = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(0, itemToMoveFrom.orderNumber).sort((a, b) => b.orderNumber - a.orderNumber)
		const areItemsAboveHidden = itemsAbove.map(item => item.hidden)
		const numHiddenItemsAbove = areItemsAboveHidden.findIndex(bool => !bool) === -1 ? areItemsAboveHidden.length : areItemsAboveHidden.findIndex(bool => !bool)
		if(itemToMoveFrom.orderNumber - numHiddenItemsAbove - 1 < 0) {
			return
		}
		const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber - numHiddenItemsAbove - 1)
		const itemRef = itemsRef.current.find(ref => itemToFocusOn._id === ref.id)
		itemRef.node.focus()
	}

	const moveDown = id => {
		const itemToMoveFrom = items.find(item => item._id === id)
		const itemsBelow = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(itemToMoveFrom.orderNumber + 1, items.length)
		const areItemsBelowHidden = itemsBelow.map(item => item.hidden)
		const numHiddenItemsBelow = areItemsBelowHidden.findIndex(bool => !bool) === -1 ? areItemsBelowHidden.length : areItemsBelowHidden.findIndex(bool => !bool)
		if(itemToMoveFrom.orderNumber + numHiddenItemsBelow + 1 > items.length - 1) {
			return
		}
		const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber + 1 + numHiddenItemsBelow)
		const itemRef = itemsRef.current.find(ref => itemToFocusOn._id === ref.id)
		itemRef.node.focus()
	}

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

	const resetStateToHomeView = () => {
		const sortedItems = inOrder(items)
		const itemsInList = inOrder(getDescendantItems(list))
		if(list !== null) {
			const prevItemsInList = itemsInList.map(item => {
				const parent = items.find(it => it._id === item.parent)
				const start = items.find(it => it._id === list).orderNumber
				const end = item.orderNumber
				const potentialParents = inOrder(items.slice(start, end))
				if(shouldItemRemainHidden(item, list, potentialParents)) {
				//if(parent.decollapsed) {
					return {
						...item,
						hidden: true
					}
				}
				else {
					return item
				}
			})
			const currList = items.find(item => item._id === list)
			const leftItems = sortedItems.slice(0, currList.orderNumber + 1)
			const rightItems = sortedItems.slice(currList.orderNumber + itemsInList.length + 1, items.length)
			const reversedItems = [
				...leftItems,
				...prevItemsInList,
				...rightItems
			]
			setItems(reversedItems)
		}
	}

	//id is not orderNumber, don't fix this one
	const enterChild = (id, list) => {
		resetStateToHomeView()

		const currItem = items.find(item => item._id === id)
		const nextItem = items.find(item => currItem.orderNumber + 1 === item.orderNumber)
		const isNextItemChild = nextItem ? nextItem.indentLevel === currItem.indentLevel + 1 : false
		console.log('@', currItem, nextItem, isNextItemChild)
		if(isNextItemChild) {
			setList(id)
			if(currItem.decollapsed) {
				const sortedItems = items.sort((a, b) => a.orderNumber - b.orderNumber)
				const itemsAfterUnhide = [
					...sortedItems.slice(0, currItem.orderNumber + 1),
					...getUnhiddenChildItems(id),
					...sortedItems.slice(currItem.orderNumber + 1 + getUnhiddenChildItems(id).length, items.length)
				]
				setItems(itemsAfterUnhide)
			}
			setFocus(nextItem._id)
		}
	}

	const returnToParent = list => {
		resetStateToHomeView()
		const parentItem = items.find(item => item._id === list)
		const parent = parentItem ? parentItem.parent : null
		setList(parent)
		setFocus(list)
	}

	const getItemsToRender = () => {
		const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
		if(list === null) {
			return itemsByON
		}
		const itemAsList = items.find(item => list === item._id)
		const descendantItems = getDescendantItems(list)
		const firstPotentialChildInd = list === null ? 0 : itemAsList.orderNumber + 1
		/*
		const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
		const areItemsChildItems = list === null ? [items.length].map(bool => true) : potentialChildItems.map(item => item.indentLevel > itemAsList.indentLevel)
		const numChildItems = list === null ? items.length : areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
		*/
		const childItems = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
		return childItems
	}

	const calcBreadCrumbsProps = listId => {
		const list = items.find(item => listId === item._id)
		if(listId === null) {
			return []
		}
		return [...calcBreadCrumbsProps(list.parent), {id: listId, title: list.itemTitle}]
	}

	const breadcrumbsClick = id => {
		const sortedItems = inOrder(items)
		const itemsInList = inOrder(getDescendantItems(list))
		if(list !== null) {
			const prevItemsInList = itemsInList.map(item => {
				const parent = items.find(it => it._id === item.parent)
				if(parent.decollapsed) {
					return {
						...item,
						hidden: true
					}
				}
				else {
					return item
				}
			})
			const currList = items.find(item => item._id === list)
			const leftItems = sortedItems.slice(0, currList.orderNumber + 1)
			const rightItems = sortedItems.slice(currList.orderNumber + itemsInList.length + 1, items.length)
			const reversedItems = [
				...leftItems,
				...prevItemsInList,
				...rightItems
			]
			setItems(reversedItems)
		}
		setList(id)
	}

	console.log('WORKFLOWY ALL ITEMS STATE (SORTED): ', inOrder(items))
	console.log('WORKFLOWY ITEMS FED TO CHILD AS PROPS (SORTED): ', inOrder(getItemsToRender()))

	return (
		<Fragment>
			<BreadCrumbs links={calcBreadCrumbsProps(list)} breadcrumbsClick={breadcrumbsClick}></BreadCrumbs>
			<ItemContainer className={classes.arimo} items={getItemsToRender()} list={list} handleAction={handleAction} reorder={reorder}/>
		</Fragment>
	)
}

export default WorkFlowy;