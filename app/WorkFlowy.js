import React, {useState, useEffect} from 'react';

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

	useEffect(() => {
		console.log('items', items)
	}, [items])

	return (
		<div></div>
	)
}

export default WorkFlowy;