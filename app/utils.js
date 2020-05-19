export const getDescendantItems = (id, items) => {
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

export const inOrder = items => {
    return items.sort((a, b) => a.orderNumber - b.orderNumber)
}