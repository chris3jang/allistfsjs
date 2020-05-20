import React, {useState, useEffect, useRef} from 'react';
import Directory from './Directory'
import {createUseStyles} from 'react-jss'

const useStyles = createUseStyles({
	container: {
        display: 'inline-block',
        verticalAlign: 'top',
        width: '240px'
    }
});

const DirectoryContainer = ({items, handleClickInDisplayer}) => {

    const classes = useStyles();

    const handleClick = list => {
        handleClickInDisplayer(list);
    }

    const calcParentItems = () => {
		const parentIds = items.map(item => item.parent);
		const nonNullParentIds = parentIds.filter(id => id !== null);
		const nonDuplicateValidParentIds = nonNullParentIds.filter((v, i) => nonNullParentIds.indexOf(v) === i);
		const parents = nonDuplicateValidParentIds.map(id => items.find(item => item._id === id));
		return parents.sort((a, b) => a.orderNumber - b.orderNumber);
    }
    
    const directories = calcParentItems()

	return (
		<div className={classes.container}>
            <Directory key={'home'} list={null} title={'Home'} indentLevel={0} handleClickInContainer={handleClick}></Directory>
            {directories.map(dir => 
                <Directory key={dir._id} list={dir._id} title={dir.itemTitle} indentLevel={dir.indentLevel + 1} handleClickInContainer={handleClick}/>
            )}
		</div>
	)
}

export default DirectoryContainer;