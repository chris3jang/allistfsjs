import React, {useState, useEffect, useRef} from 'react';

import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
    header: {
        margin: '0% 20%'
    },
	link: {
        backgroundColor: 'grey'
    }
})

const BreadCrumbs = ({links}) => {

    const classes = useStyles();

    const renderLinks = links => {
        return links.reduce((linkedTitles, currentTitle) => {
            return `${linkedTitles} > ${currentTitle.title}`
        }, 'Home')
    }
    console.log(renderLinks(links))

	return (
		<div className={classes.header}>{renderLinks(links)}</div>
	)
}

export default BreadCrumbs;