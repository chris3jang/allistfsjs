import React, {useState, useEffect, Fragment} from 'react';
import Item from './Item'
import ItemContainer from './ItemContainer'
import BreadCrumbs from './BreadCrumbs'

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

	useEffect(() => {
		console.log('items passed to displayer', items)
	}, [items])
    
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
            //setItems(reversedItems)
            setCurrVisibleHiddenItems(null)
		}
	}

	const enterChild = id => {
		console.log("enterChild inside displayer", id)
		resetStateToHomeView()
		const currItem = items.find(item => item._id === id)
		const nextItem = items.find(item => currItem.orderNumber + 1 === item.orderNumber)
		const isNextItemChild = nextItem ? nextItem.indentLevel === currItem.indentLevel + 1 : false
		if(isNextItemChild) {
			setList(id)
			if(currItem.decollapsed) {
                /*
				const sortedItems = inOrder(items)
				const itemsAfterUnhide = [
					...sortedItems.slice(0, currItem.orderNumber + 1),
					...getUnhiddenChildItems(id),
					...sortedItems.slice(currItem.orderNumber + 1 + getUnhiddenChildItems(id).length, items.length)
				]
				console.log('itemsAfterUnhide', itemsAfterUnhide)
                setItems(itemsAfterUnhide)
                */
               setCurrVisibleHiddenItems(getUnhiddenChildItems(id))
            }
            //setFocus(nextItem._id)
            /**CHECKLIST  */
		}
	}

	const returnToParent = list => {
		console.log("returnToParent inside displayer", list)
        resetStateToHomeView()
		const currentItem = items.find(item => item._id === list)
        const parent = currentItem ? currentItem.parent : null
        setList(parent)
        //setFocus(list)
        /*CHECKLIST focus on list in parent component */
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
			return itemsByON
        }
        if(currVisibleHiddenItems) {
            return currVisibleHiddenItems
        }
		const itemAsList = items.find(item => list === item._id)
        const descendantItems = getDescendantItems(list)
		const firstPotentialChildInd = list === null ? 0 : itemAsList.orderNumber + 1
		/*
		const potentialChildItems = itemsByON.slice(firstPotentialChildInd)
		const areItemsChildItems = list === null ? [items.length].map(bool => true) : potentialChildItems.map(item => item.indentLevel > itemAsList.indentLevel)
		const numChildItems = list === null ? items.length : areItemsChildItems.findIndex(bool => !bool) === -1 ? areItemsChildItems.length : areItemsChildItems.findIndex(bool => !bool)
		*/
		const itemsToDisplay = itemsByON.slice(firstPotentialChildInd, firstPotentialChildInd + descendantItems.length)
		return itemsToDisplay
	}

	const handleDisplayAction = (action, id, value) => {
		switch (action) {
			case 'enterChild': {
				enterChild(id, value)
				break;
			}
			case 'returnToParent': {
				returnToParent(value)
				break;
			}
			default: {
				handleAction(action, id, value)
			}
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