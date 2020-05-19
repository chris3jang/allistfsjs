import React from 'react';

import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
    header: {
        margin: '2rem 240px'
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

const BreadCrumbs = ({items, list, breadcrumbsClick}) => {

    const classes = useStyles();

    const handleClick = id => {
        console.log('handleClick', id)
        breadcrumbsClick(id)
    }

    const calcBreadCrumbsProps = listId => {
        const listAsItem = items.find(item => listId === item._id)
        if(listId === null) {
            return []
        }
        return [...calcBreadCrumbsProps(listAsItem.parent), {id: listId, title: listAsItem.itemTitle}]
    }

    const returnLink = (id, title) => <a className={classes.link} onClick={() => handleClick(id)}>{title}</a>

    const renderLinks = links => 
        links.reduce((linkedTitles, currentTitle) => 
            [...linkedTitles, <p className={classes.divider}>  >  </p>, returnLink(currentTitle.id, currentTitle.title)], 
        [returnLink(null, 'Home')])

    const links = calcBreadCrumbsProps(list)

	return (
		<div className={classes.header}>{renderLinks(links)}</div>
	)
}

export default BreadCrumbs;