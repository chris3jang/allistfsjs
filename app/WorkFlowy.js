import React, {useState, useEffect} from 'react';
import ItemContainer from './ItemContainer'

const WorkFlowy = () => {

	const [items, setItems] = useState([])

	useEffect(() => {
		let fetchedData = []
		fetch('/items/', { headers: new Headers({authorization: 'Bearer ' + localStorage.getItem('access')})})
			.then((resp) => resp.json())
			.then((data) => {
				setItems(data)
			})

	}, [])

	return (
		<ItemContainer items={items}/>
	)
}

export default WorkFlowy;