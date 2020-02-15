import React, { useState, useEffect } from 'react';
import styles from './css/editabletext.css'

import ContentEditable from 'react-contenteditable'
import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
	'@font-face': {
		fontFamily: 'Arimo',
		src: 'url("./fonts/Arimo/Arimo-Regular.ttf") format("truetype")'
	},
	text: {
		fontFamily: 'Arimo',
		display: 'inline-block',
		verticalAlign: 'top',
		position: 'relative',
		left: '6px',
		bottom: '3px',
		paddingRight: '1px',
		maxWidth: 'calc(100% - 12px)'
	},
	completed: {
		textDecoration: 'line-through'
	}
})

const EditableText = ({id, orderNumber, itemTitle, checked, handleAction}) => {

	const classes = useStyles();

	const handleTextChange = e => {
		if(e.target.value) {
			handleAction('editItemTitle', orderNumber, e.target.value)
		}
	}

	const handleKeyPress = e => {
		console.log('1')
		if(e.key === 'Enter') {
			console.log('2')
			if(e.metaKey) {
				e.preventDefault()
				handleAction('toggleCheckbox', orderNumber)
			}
			else {
				console.log('3')
				e.preventDefault()
				handleAction('createItem', orderNumber)
			}
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
			e.preventDefault()
			handleAction('moveUp', orderNumber)
		}
		if(e.key === 'ArrowDown') {
			e.preventDefault()
			handleAction('moveDown', orderNumber)
		}

	}

	const handleRefCreate = (node) => {
		handleAction('createRef', id, node)
	}

	return (
		<ContentEditable
			className={checked ? `${classes.text} ${classes.completed}` : classes.text}
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