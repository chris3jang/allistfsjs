import React, { useState, useEffect } from 'react';
import styles from './css/editabletext.css'

import ContentEditable from 'react-contenteditable'

const EditableText = ({id, orderNumber, itemTitle, handleAction}) => {

	const handleTextChange = e => {
		if(e.target.value) {
			handleAction('editItemTitle', orderNumber, e.target.value)
		}
	}

	const handleKeyPress = e => {
		console.log('12', e.key, e.target, e.target.value, e.metaKey)
		if(e.key === 'Enter') {
			e.preventDefault()
			handleAction('createItem', orderNumber)
		}
		if(e.key === 'Backspace' && !e.target.innerText) {
			e.preventDefault()
			handleAction('deleteItem', orderNumber)
		}
		if(e.key === 'Tab') {
			e.preventDefault()
			if(e.shiftKey) {
				handleAction('untabItem', orderNumber)
			}
			else {
				handleAction('tabItem', orderNumber)
			}
		}
		if(e.key === 'ArrowLeft' && e.metaKey) {
			e.preventDefault()
			handleAction('decollapseItem', orderNumber)
		}
		if(e.key === 'ArrowRight' && e.metaKey) {
			e.preventDefault()
			handleAction('collapseItem', orderNumber)
		}
		if(e.key === 'ArrowUp') {
			if(e.metaKey) {

			}
			else {

			}
		}
		if(e.key === 'ArrowUp') {
			if(e.metaKey) {

			}
			else {
				
			}
		}

	}

	const handleRefCreate = (node) => {
		handleAction('createRef', id, node)
	}

	return (
		<ContentEditable
			className={styles.contentEditableDiv}
			innerRef={node => handleRefCreate(node, 'div')}
			html={itemTitle}
			disabled={false}
			spellCheck={false}
			onChange={handleTextChange}
			onKeyDown={handleKeyPress}
		/>
	)
}

export default EditableText;