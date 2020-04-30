import React, {useState, useEffect, useRef} from 'react';

import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
    header: {
        margin: '2rem 20%'
    },
    '@font-face': {
		fontFamily: 'Arimo',
		src: 'url("./fonts/Arimo/Arimo-Regular.ttf") format("truetype")'
    },
	link: {
        fontFamily: 'Arimo',
        color: 'grey',
        textDecoration: 'underline',
        '&:hover': {
            cursor: 'pointer'
        },
    },
    divider: {
        display: 'inline-block',
        margin: '0 1rem'
    }
})

const BreadCrumbs = ({links, breadcrumbsClick}) => {

    const classes = useStyles();

    const handleClick = id => {
        console.log('handleClick', id)
        breadcrumbsClick(id)
    }

    const returnLink = (id, title) => <a className={classes.link} onClick={() => handleClick(id)}>{title}</a>

    const renderLinks = links => 
        links.reduce((linkedTitles, currentTitle) => 
            [...linkedTitles, <p className={classes.divider}>  >  </p>, returnLink(currentTitle.id, currentTitle.title)], 
        [returnLink(null, 'Home')])

	return (
		<div className={classes.header}>{renderLinks(links)}</div>
	)
}

export default BreadCrumbs;