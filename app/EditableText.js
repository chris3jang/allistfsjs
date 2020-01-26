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
		console.log('12', e.key, e.target, e.target.value)
		if(e.key === 'Enter') {
			e.preventDefault()
			handleAction('createItem', orderNumber)
		}
		if(e.key == 'Backspace' && !e.target.innerText) {
			console.log('do i get here?')
			e.preventDefault()
			handleAction('deleteItem', orderNumber)
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