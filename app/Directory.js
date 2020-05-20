import React, {useState, useEffect, useRef} from 'react';
import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
    '@font-face': {
		fontFamily: 'Arimo',
		src: 'url("./fonts/Arimo/Arimo-Regular.ttf") format("truetype")'
    },
    directory: {
        display: 'block',
        marginTop: '2px',
		fontFamily: 'Arimo',
		fontSize: '18px',
		verticalAlign: 'top',
		position: 'relative',
		left: '6px',
		bottom: '4px',
		paddingRight: '1px',
        maxWidth: 'calc(100% - 12px)',
		paddingLeft: val => val * 20,
		'&:hover': {
			cursor: 'pointer',
		}
	},
	icon: {
		position: 'relative',
		top: 4
	},
	title: {
		display: 'inline-block',
		position: 'relative',
		bottom: 2,
		left: 4,
		margin: 0
	}
})

const Directory = ({list, title, indentLevel, handleClickInContainer}) => {

    const classes = useStyles(indentLevel);

    const handleClick = () => {
        handleClickInContainer(list)
    }

	return (
		<div className={classes.directory} onClick={handleClick}>
			<span className={`material-icons ${classes.icon}`}>folder</span>
            <p className={classes.title}>{title}</p>
		</div>
	)
}

export default Directory;