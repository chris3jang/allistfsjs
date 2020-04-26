import React, {useState, useEffect, useRef, Fragment} from 'react';
import Item from './Item'
import ItemContainer from './ItemContainer'
import BreadCrumbs from './BreadCrumbs'
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

const Displayer = ({items, handleAction, reorder}) => {

	const classes = useStyles()

    const [list, setList] = useState(null)
	const [currVisibleHiddenItems, setCurrVisibleHiddenItems] = useState(null)
	const [itemToFocus, setFocus] = useState()
	const [mounted, setMounted] = useState(false)
	const itemsRef = useRef({})
	const hiddenRef = useRef([])

	useEffect(() => {
		setMounted(true)
	}, [])

	const prevItems = usePrevious(items)
	useEffect(() => {
		if(mounted) {
			if(prevItems.length === items.length - 1) {
				const addedItem = items.find(item => prevItems.findIndex(prevItem => item._id === prevItem._id) === -1)
				itemsRef.current[addedItem._id].focus()
			}
			if(prevItems.length === items.length + 1) {
				const deletedItem = prevItems.find(prevItem => items.findIndex(item => prevItem._id === item._id) === -1)
				const itemsAbove = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(0, deletedItem.orderNumber).sort((a, b) => b.orderNumber - a.orderNumber)
				const areItemsAboveHidden = itemsAbove.map(item => item.hidden)
				const numHiddenItemsAbove = areItemsAboveHidden.findIndex(bool => !bool) === -1 ? areItemsAboveHidden.length : areItemsAboveHidden.findIndex(bool => !bool)
				if(deletedItem.orderNumber - numHiddenItemsAbove - 1 >= 0) {
					const itemToFocusOn = items.find(item => item.orderNumber === deletedItem.orderNumber - numHiddenItemsAbove - 1)
					const itemRef = itemsRef.current[itemToFocusOn._id]
					itemRef.focus()
				}
			}
		}
	}, [items])

	useEffect(() => {
		if(itemsRef.current[itemToFocus]) {
			console.log('itemToFocus', itemToFocus)
			console.log('itemsRef.current', itemsRef.current)
			const itemRef = itemsRef.current[itemToFocus]
			itemRef.focus()
			setFocus(null)
		}
	}, [itemToFocus])
    
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
	
	const createRef = (id, node) => {
		itemsRef.current[id] = node
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

	const getUnhiddenChildItems = id => {
		const itemsByON = inOrder(items)
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
            setCurrVisibleHiddenItems(null)
		}
	}

	const enterChild = id => {
		const currItem = items.find(item => item._id === id)
		const nextItem = items.find(item => currItem.orderNumber + 1 === item.orderNumber)
		console.log('currItem', currItem)
		console.log('nextItem', nextItem)
		const isNextItemChild = nextItem ? nextItem.indentLevel === currItem.indentLevel + 1 : false
		console.log('isNextItemChild', isNextItemChild)
		if(isNextItemChild) {
			resetStateToHomeView()
			console.log('4', shouldItemRemainHidden(nextItem, currItem, items))
			setList(id)
			//figure out which condition below makes more sense
			if(currItem.decollapsed || nextItem.hidden) {
               setCurrVisibleHiddenItems(getUnhiddenChildItems(id))
            }
            setFocus(nextItem._id)
		}
	}

	const returnToParent = list => {
		resetStateToHomeView()
		const currItem = items.find(item => item._id === list)
		const parent = currItem ? currItem.parent : null
		if(currItem.hidden) {
			setCurrVisibleHiddenItems(getUnhiddenChildItems(parent))
		}
        setList(parent)
        setFocus(list)
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
    
    const getItemsToDisplay = () => {
		const itemsByON = inOrder(items)
		if(list === null) {
			console.log('1', itemsByON)
			return itemsByON
        }
        if(currVisibleHiddenItems) {
			console.log('2', currVisibleHiddenItems)
            return currVisibleHiddenItems
        }
		const itemAsList = items.find(item => list === item._id)
        const descendantItems = getDescendantItems(list)
		const firstPotentialChildInd = list === null ? 0 : itemAsList.orderNumber + 1
		const itemsToDisplay = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
		console.log('3', itemsToDisplay)
		return itemsToDisplay
	}

	const handleDisplayAction = (action, id, value) => {
		switch (action) {
			case 'createRef':
				createRef(id, value)
				break;
			case 'enterChild': {
				enterChild(id, value)
				break;
			}
			case 'returnToParent': {
				returnToParent(value)
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
			default: {
				handleAction(action, id, value)
			}
		}	
	}

	const moveUp = id => {
		if(currVisibleHiddenItems) {
			console.log('currVisibleHiddenItems', currVisibleHiddenItems)
			const itemToMoveFrom = currVisibleHiddenItems.find(item => item._id === id)
			const itemToMoveFromInd = currVisibleHiddenItems.findIndex(item => item._id === id)
			const itemsAbove = currVisibleHiddenItems.sort((a, b) => a.orderNumber - b.orderNumber).slice(0, itemToMoveFromInd).sort((a, b) => b.orderNumber - a.orderNumber)
			const areItemsAboveHidden = itemsAbove.map(item => item.hidden)
			const numHiddenItemsAbove = areItemsAboveHidden.findIndex(bool => !bool) === -1 ? areItemsAboveHidden.length : areItemsAboveHidden.findIndex(bool => !bool)
			if(itemToMoveFromInd - numHiddenItemsAbove - 1 < 0) {
				return
			}
			const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber - numHiddenItemsAbove - 1)
			console.log('itemToFocusOn', itemToFocusOn)
			const itemRef = itemsRef.current[itemToFocusOn._id]
			itemRef.focus()
		}
		else {
			const itemToMoveFrom = items.find(item => item._id === id)

			const itemsAbove = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(0, itemToMoveFrom.orderNumber).sort((a, b) => b.orderNumber - a.orderNumber)
			const areItemsAboveHidden = itemsAbove.map(item => item.hidden)
			const numHiddenItemsAbove = areItemsAboveHidden.findIndex(bool => !bool) === -1 ? areItemsAboveHidden.length : areItemsAboveHidden.findIndex(bool => !bool)
			if(itemToMoveFrom.orderNumber - numHiddenItemsAbove - 1 < 0) {
				return
			}
			const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber - numHiddenItemsAbove - 1)
			const itemRef = itemsRef.current[itemToFocusOn._id]
			console.log('moveUp')
			console.log('itemsRef', itemsRef)
			console.log('itemRef', itemRef)
			console.log('id', id)
			console.log('itemToFocusOn._id', itemToFocusOn._id)
			itemRef.focus()
		}
	}

	const moveDown = id => {
		if(currVisibleHiddenItems) {
			const itemToMoveFrom = currVisibleHiddenItems.find(item => item._id === id)
			const itemToMoveFromInd = currVisibleHiddenItems.findIndex(item => item._id === id)
			const itemsBelow = currVisibleHiddenItems.sort((a, b) => a.orderNumber - b.orderNumber).slice(itemToMoveFromInd + 1, items.length)
			const areItemsBelowHidden = itemsBelow.map(item => item.hidden)
			const numHiddenItemsBelow = areItemsBelowHidden.findIndex(bool => !bool) === -1 ? areItemsBelowHidden.length : areItemsBelowHidden.findIndex(bool => !bool)
			if(itemToMoveFromInd + numHiddenItemsBelow + 1 > items.length - 1) {
				return
			}
			const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber + 1 + numHiddenItemsBelow)
			console.log('itemsBelow', itemsBelow)
			console.log('areItemsBelowHidden', areItemsBelowHidden)
			console.log('numHiddenItemsBelow', numHiddenItemsBelow)
			console.log('itemToFocusOn', itemToFocusOn)
			const itemRef = itemsRef.current[itemToFocusOn._id]
			itemRef.focus()
		}
		else {
			const itemToMoveFrom = items.find(item => item._id === id)
			const itemsBelow = items.sort((a, b) => a.orderNumber - b.orderNumber).slice(itemToMoveFrom.orderNumber + 1, items.length)
			const areItemsBelowHidden = itemsBelow.map(item => item.hidden)
			const numHiddenItemsBelow = areItemsBelowHidden.findIndex(bool => !bool) === -1 ? areItemsBelowHidden.length : areItemsBelowHidden.findIndex(bool => !bool)
			if(itemToMoveFrom.orderNumber + numHiddenItemsBelow + 1 > items.length - 1) {
				return
			}
			const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber + 1 + numHiddenItemsBelow)
			const itemRef = itemsRef.current[itemToFocusOn._id]
			console.log('moveDown')
			console.log('itemsRef', itemsRef)
			console.log('itemRef', itemRef)
			console.log('id', id)
			console.log('itemToFocusOn._id', itemToFocusOn._id)
			itemRef.focus()
		}
	}

	return (
		<Fragment>
			<BreadCrumbs links={calcBreadCrumbsProps(list)} breadcrumbsClick={breadcrumbsClick}></BreadCrumbs>
            <ItemContainer className={classes.arimo} items={getItemsToDisplay()} list={list} handleAction={handleDisplayAction} reorder={reorder}/>
		</Fragment>
	)
}

export default Displayer;