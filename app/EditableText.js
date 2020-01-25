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
		if(e.key === 'Enter') {
			e.preventDefault()
			handleAction('createItem', orderNumber)
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
			onKeyPress={handleKeyPress}
		/>
	)
}

export default EditableText;