import React, {useState, useEffect, useRef} from 'react';
import styles from './css/editabletext.css'

import ContentEditable from 'react-contenteditable'

const EditableText = ({orderNumber, itemTitle, handleAction}) => {

	const contentEditableRef = useRef(null)

	const handleTextChange = e => {
		console.log('event', e)
		if(e.target.value) {
			handleAction('edit', orderNumber, e.target.value)
		}
	}

	return (
		<ContentEditable
			className={styles.contentEditableDiv}
			innerRef={contentEditableRef}
			html={itemTitle}
			disabled={false}
			spellCheck={false}
			onChange={handleTextChange}
		/>
	)
}

export default EditableText;