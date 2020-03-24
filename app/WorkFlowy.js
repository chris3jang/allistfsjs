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
			console.log('items', items)
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

	useEffect(() => {
		if(itemToFocus) {
			console.log('itemToFocus', itemToFocus)
			for(let i = 0; i < itemsRef.current.length; i++) {
				console.log('i', itemsRef.current[i])
			}
			const itemRef = itemsRef.current.find(ref => ref.id === itemToFocus)
			console.log('itemRef', itemRef)
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

	//when orderNumber changes to id, we will need orderNumber from data, instead of from state
	const createItem = id => {
		callFetch('createItem', { id}).then(data => {
			const itemCreatingNewItem = items.find(item => item._id === id)
			const itemsBeforeCreateByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const potentialHiddenItems = itemsBeforeCreateByON.slice(itemCreatingNewItem.orderNumber + 1)//orderNumber + 1
			const areHiddenChildItems = potentialHiddenItems.map(item => item.hidden)
			const numHiddenChildItems = areHiddenChildItems.findIndex(bool => !bool) === -1 ? 0 : areHiddenChildItems.findIndex(bool => !bool)
			const newOrderNumber = itemCreatingNewItem.orderNumber + numHiddenChildItems + 1
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
			const deletedItem = items.find(item => item._id === id)
			const itemsBeforeDeleteByON = items.slice().sort((a, b) => a.orderNumber - b.orderNumber)
			const itemToDelete = items.find(item => item.orderNumber === deletedItem.orderNumber)

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
			const tabbedItem = items.find(item => item._id === id)
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const firstPotentialChildInd = tabbedItem.orderNumber + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > tabbedItem.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? 0 : areItemsChildItems.findIndex(bool => !bool)
			const itemsToIncrement = itemsByON.slice(tabbedItem.orderNumber, firstPotentialChildInd + numChildItems)
			const itemsAfterIncrementing = itemsToIncrement.map(item => {
				return {
					...item,
					indentLevel: item.indentLevel + 1
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < tabbedItem.orderNumber)
			const remainingItems = itemsByON.filter(item => item.orderNumber > tabbedItem.orderNumber + numChildItems)
			const itemsAfterTab = [...unchangedItems, ...itemsAfterIncrementing, ...remainingItems]
			setItems(itemsAfterTab)
		})
	}

	const untabItem = id => {
		callFetch('untabItem', { id }).then(() => {
			const untabbedItem = items.find(item => item._id === id)
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const firstPotentialChildInd = untabbedItem.orderNumber + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > untabbedItem.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
			const itemsToDecrement = itemsByON.slice(untabbedItem.orderNumber, firstPotentialChildInd + numChildItems)
			const itemsAfterDecrementing = itemsToDecrement.map(item => {
				return {
					...item,
					indentLevel: item.indentLevel - 1
				}
			})
			const unchangedItems = itemsByON.filter(item => item.orderNumber < untabbedItem.orderNumber)
			const remainingItems = itemsByON.filter(item => item.orderNumber > untabbedItem.orderNumber + numChildItems)
			const itemsAfterUntab = [...unchangedItems, ...itemsAfterDecrementing, ...remainingItems]
			setItems(itemsAfterUntab)
		})
	}

	const shouldItemRemainHidden = (item, itemToggled, potentialParents) => {
		console.log('item', item)
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
		const firstPotentialChildInd = itemOrderNumber + 1
		const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
		const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToCollapse.indentLevel)
		const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
		const itemsToPotentiallyUnhide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + numChildItems)
		const potentialParents = itemsByON.slice(itemOrderNumber, itemOrderNumber + 1 + numChildItems)
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
		return unhiddenItems
	}

	const collapseItem = id => {
		callFetch('collapseItem', { id, decollapsed: true}).then(() => {
			const itemToCollapse = items.find(item => item._id === id)
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const firstPotentialChildInd = itemToCollapse.orderNumber + 1
			const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
			const areItemsChildItems = potentialChildItems.map(item => item.indentLevel > itemToCollapse.indentLevel)
			const numChildItems = areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
			const itemsToPotentiallyUnhide = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + numChildItems)
			const potentialParents = itemsByON.slice(itemToCollapse.orderNumber, firstPotentialChildInd + numChildItems)
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
			const itemsAfterCollapse = [...itemsByON.slice(0, itemToCollapse.orderNumber), itemAfterCollapse, ...unhiddenItems, ...itemsByON.slice(firstPotentialChildInd + numChildItems)]
			console.log('itemsAfterCollapse', itemsAfterCollapse)
			setItems(itemsAfterCollapse)

		})
	}

	const decollapseItem = id => {
		callFetch('decollapseItem', { id, decollapsed: false}).then(() => {
			const itemToDecollapse = items.find(item => item._id === id)
			const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
			const firstPotentialChildInd = itemToDecollapse.orderNumber + 1
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
			const unchangedItems = itemsByON.filter(item => item.orderNumber < itemToDecollapse.orderNumber)
			const remainingItems = itemsByON.filter(item => item.orderNumber > itemToDecollapse.orderNumber + numChildItems)
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
				console.log('yeet', item.itemTitle)
				const parent = items.find(it => it._id === item.parent)
				console.log(parent)
				const start = items.find(it => it._id === list).orderNumber
				const end = item.orderNumber
				const potentialParents = inOrder(items.slice(start, end))
				console.log("pot*()", potentialParents)
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
			console.log('789', leftItems, prevItemsInList, rightItems)
			const reversedItems = [
				...leftItems,
				...prevItemsInList,
				...rightItems
			]
			console.log('reversedItems', reversedItems)
			setItems(reversedItems)
		}
	}

	//id is not orderNumber, don't fix this one
	const enterChild = (id, list) => {
		resetStateToHomeView()

		const currItem = items.find(item => item._id === id)
		console.log('currItem', currItem)
		const nextItem = items.find(item => currItem.orderNumber + 1 === item.orderNumber)
		console.log('nextItem', nextItem)
		const isNextItemChild = nextItem ? nextItem.indentLevel === currItem.indentLevel + 1 : false
		console.log('isNextItemChild', isNextItemChild)
		if(isNextItemChild) {
			setList(id)
			if(currItem.decollapsed) {
				const sortedItems = items.sort((a, b) => a.orderNumber - b.orderNumber)
				const itemsAfterUnhide = [
					...sortedItems.slice(0, currItem.orderNumber + 1),
					...getUnhiddenChildItems(id),
					...sortedItems.slice(currItem.orderNumber + 1 + getUnhiddenChildItems(id).length, items.length)
				]
				console.log('here?', [...sortedItems.slice(0, currItem.orderNumber + 1)], [...getUnhiddenChildItems(id)], [...sortedItems.slice(currItem.orderNumber + 1, currItem.orderNumber + 1 + getUnhiddenChildItems(id).length)])
				console.log('itemsAfterUnhide', itemsAfterUnhide)
				setItems(itemsAfterUnhide)
			}
			setFocus(nextItem._id)
		}
	}

	const returnToParent = list => {
		resetStateToHomeView()
		console.log('list', list)
		const parentItem = items.find(item => item._id === list)
		console.log('parentItem', parentItem)
		const parent = parentItem ? parentItem.parent : null
		console.log('@', parentItem, parent)
		setList(parent)
		setFocus(list)
	}

	const getItemsToRender = () => {
		const itemsByON = items.slice(0).sort((a, b) => a.orderNumber - b.orderNumber)
		const itemAsList = items.find(item => list === item._id)
		const firstPotentialChildInd = list === null ? 0 : itemAsList.orderNumber + 1
		const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
		const areItemsChildItems = list === null ? [items.length].map(bool => true) : potentialChildItems.map(item => item.indentLevel > itemAsList.indentLevel)
		const numChildItems = list === null ? items.length : areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
		const childItems = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + numChildItems)
		return childItems
	}

	const calcBreadCrumbsProps = listId => {
		const list = items.find(item => listId === item._id)
		if(listId === null) {
			return []
		}
		return [...calcBreadCrumbsProps(list.parent), {id: listId, title: list.itemTitle}]
	}

	console.log(getItemsToRender())

	const breadcrumbsClick = id => {
		const sortedItems = inOrder(items)
		console.log('list', list)
		const itemsInList = inOrder(getDescendantItems(list))
		console.log('itemsInList', itemsInList)
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
			console.log('l', leftItems, 'p', prevItemsInList, 'r', rightItems)
			console.log('reversedItems', reversedItems)
			setItems(reversedItems)
		}
		setList(id)
	}

	return (
		<Fragment>
			<BreadCrumbs links={calcBreadCrumbsProps(list)} breadcrumbsClick={breadcrumbsClick}></BreadCrumbs>
			<ItemContainer className={classes.arimo} items={getItemsToRender()} list={list} handleAction={handleAction}/>
		</Fragment>
	)
}

export default WorkFlowy;