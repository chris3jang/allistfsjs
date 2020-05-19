import React, {useState, useEffect, useRef, Fragment} from 'react';
import DirectoryContainer from './DirectoryContainer'
import ItemContainer from './ItemContainer'
import BreadCrumbs from './BreadCrumbs'
import { usePrevious } from './hooks'

import { createUseStyles } from 'react-jss'

import { getDescendantItems, inOrder } from './utils'

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
			if(currVisibleHiddenItems) {
				resetStateToHomeView()
				selectList(list)
			}
			else {
				if(prevItems.length + 1 === items.length) {
					const addedItem = items.find(item => prevItems.findIndex(prevItem => item._id === prevItem._id) === -1)
					if(itemsRef.current[addedItem._id]) {
						itemsRef.current[addedItem._id].focus()
					}
				}
				if(prevItems.length - 1 === items.length) {
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
		}
	}, [items])

	useEffect(() => {
		if(itemsRef.current[itemToFocus]) {
			const itemRef = itemsRef.current[itemToFocus]
			itemRef.focus()
			setFocus(null)
		}
	}, [itemToFocus])

	const prevItemsInCurrVisibleHiddenItems = usePrevious(currVisibleHiddenItems)
	useEffect(() => {
		if(currVisibleHiddenItems && prevItemsInCurrVisibleHiddenItems) {
			if(prevItemsInCurrVisibleHiddenItems.length + 1 === currVisibleHiddenItems.length) {
				const addedItem = currVisibleHiddenItems.find(item => prevItemsInCurrVisibleHiddenItems.findIndex(prevItem => item._id === prevItem._id) === -1)
				setFocus(addedItem._id)
			}
			if(prevItemsInCurrVisibleHiddenItems.length - 1 === currVisibleHiddenItems.length) {
				const deletedItem = prevItemsInCurrVisibleHiddenItems.find(prevItem => items.findIndex(item => prevItem._id === item._id) === -1)
				const leftItemsNotHidden = currVisibleHiddenItems.filter(item => item.orderNumber < deletedItem.orderNumber && !item.hidden)
				const leftItemsOrderNumbers = leftItemsNotHidden.map(item => item.orderNumber)
				const itemToFocusOn = currVisibleHiddenItems.find(item => item.orderNumber === Math.max(...leftItemsOrderNumbers))
				setFocus(itemToFocusOn._id)
			}
		}
	}, [currVisibleHiddenItems])
	
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
		const descendantItems = getDescendantItems(itemToCollapse._id, items)
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
		const itemsInList = inOrder(getDescendantItems(list, items))
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

	const selectList = id => {
		const currItem = items.find(item => item._id === id)
		const nextItem = items.find(item => currItem.orderNumber + 1 === item.orderNumber)
		const isNextItemChild = nextItem ? nextItem.indentLevel === currItem.indentLevel + 1 : false
		if(isNextItemChild) {
			resetStateToHomeView()
			setList(id)
			//figure out which condition below makes more sense
			if(currItem.decollapsed || nextItem.hidden) {
               setCurrVisibleHiddenItems(getUnhiddenChildItems(id))
            }
		}
		if(isNextItemChild) return nextItem
		else return null
	}

	const enterChild = id => {
		const nextItem = selectList(id)
		if(nextItem) {
			setFocus(nextItem._id)
		}
	}

	const returnToParent = list => {
		resetStateToHomeView()
		const currItem = items.find(item => item._id === list)
		const parent = currItem ? currItem.parent : null
		if(currItem && currItem.hidden) {
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
		resetStateToHomeView()
		const listToMoveTo = items.find(item => item._id === id)
		if(listToMoveTo && listToMoveTo.decollapsed) {
			setCurrVisibleHiddenItems(getUnhiddenChildItems(id))
		}
		setList(id)
    }
    
    const getItemsToDisplay = () => {
		const itemsByON = inOrder(items)
		if(list === null) {
			return itemsByON
        }
        if(currVisibleHiddenItems) {
            return currVisibleHiddenItems
        }
		const itemAsList = items.find(item => list === item._id)
        const descendantItems = getDescendantItems(list, items)
		const firstPotentialChildInd = list === null ? 0 : itemAsList.orderNumber + 1
		const itemsToDisplay = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
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
			case 'tabItem': {
				if(getNearestSiblingAbove(id)) {
					handleAction(action, id, value)
				}
				break;
			}
			case 'untabItem': {
				if(canItemUntab(id)) {
					handleAction(action, id, value)
				}
				break;
			}
			default: {
				handleAction(action, id, value)
			}
		}	
	}

	const canItemUntab = id => {
		const currentItems = getItemsToDisplay()
		const itemToUntab = currentItems.find(item => item._id === id)
		return itemToUntab.parent !== list
	}

	const getNearestSiblingAbove = id => {
		const currentItems = getItemsToDisplay()
		const itemToFindNewParentFor = currentItems.find(item => item._id === id)
		const leftItems = currentItems.filter(item => item.orderNumber < itemToFindNewParentFor.orderNumber)
		const leftItemsReversed = leftItems.sort((a, b) => b.orderNumber - a.orderNumber)
		const areLeftItemsReversedSiblings = leftItemsReversed.map(item => {
			if(item.indentLevel === itemToFindNewParentFor.indentLevel) {
				return true
			}
			if(item._id === itemToFindNewParentFor.parent) {
				return false
			}
			return null
		})
		const potentialNewParentIndex = areLeftItemsReversedSiblings.findIndex(status => status === true)
		const parentIndex = areLeftItemsReversedSiblings.findIndex(status => status === false)
		if(potentialNewParentIndex === -1) {
			return null
		}
		if(potentialNewParentIndex < parentIndex || parentIndex === -1) {
			const nearestSiblingAbove = leftItemsReversed[potentialNewParentIndex]
			return nearestSiblingAbove
		}
		else {
			return null
		}
	}

	const moveUp = id => {
		const displayedItems = currVisibleHiddenItems ? currVisibleHiddenItems : items;
		const itemToMoveFrom = displayedItems.find(item => item._id === id)
		const itemToMoveFromInd = displayedItems.findIndex(item => item._id === id)
		const itemsAbove = displayedItems.sort((a, b) => a.orderNumber - b.orderNumber).slice(0, itemToMoveFromInd).sort((a, b) => b.orderNumber - a.orderNumber)
		const areItemsAboveHidden = itemsAbove.map(item => item.hidden)
		const numHiddenItemsAbove = areItemsAboveHidden.findIndex(bool => !bool) === -1 ? areItemsAboveHidden.length : areItemsAboveHidden.findIndex(bool => !bool)
		if(itemToMoveFromInd - numHiddenItemsAbove - 1 < 0) {
			return
		}
		const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber - numHiddenItemsAbove - 1)
		const itemRef = itemsRef.current[itemToFocusOn._id]
		if(itemRef) {
			itemRef.focus()
		}
	}

	const moveDown = id => {
		const displayedItems = currVisibleHiddenItems ? currVisibleHiddenItems : items;
		const itemToMoveFrom = displayedItems.find(item => item._id === id)
		const itemToMoveFromInd = displayedItems.sort((a, b) => a.orderNumber - b.orderNumber).findIndex(item => item._id === id)
		const itemsBelow = displayedItems.sort((a, b) => a.orderNumber - b.orderNumber).slice(itemToMoveFromInd + 1, items.length)
		const areItemsBelowHidden = itemsBelow.map(item => item.hidden)
		const numHiddenItemsBelow = areItemsBelowHidden.findIndex(bool => !bool) === -1 ? areItemsBelowHidden.length : areItemsBelowHidden.findIndex(bool => !bool)
		if(itemToMoveFromInd + numHiddenItemsBelow + 1 > items.length - 1) {
			return
		}
		const itemToFocusOn = items.find(item => item.orderNumber === itemToMoveFrom.orderNumber + 1 + numHiddenItemsBelow)
		if(itemToFocusOn) {
			const itemRef = itemsRef.current[itemToFocusOn._id]
			if(itemRef) {
				itemRef.focus()
			}
		}
	}

	return (
		<Fragment>
			<BreadCrumbs links={calcBreadCrumbsProps(list)} breadcrumbsClick={breadcrumbsClick}></BreadCrumbs>
			<DirectoryContainer items={items} handleClickInDisplayer={breadcrumbsClick}></DirectoryContainer>
            <ItemContainer className={classes.arimo} items={getItemsToDisplay()} list={list} handleAction={handleDisplayAction} reorder={reorder}/>
		</Fragment>
	)
}

export default Displayer;