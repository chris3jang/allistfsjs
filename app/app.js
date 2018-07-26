
import React from 'react';
import ReactDOM from 'react-dom';
import AllistItem from './Allistitem'
import Lists from './Lists'
import CurrentList from './CurrentList'
import NavBar from './NavBar'
import styles from './app.css'

/*
const React = require("react")
const ReactDom = require("react-dom")
const AllistItem = require("AllistItem")
*/

class Home extends React.Component {

	state = {
		selectedListIndex: null,
		editMenu: false,
		listsFocus: false,
		updateChild: false
	}

	componentDidMount() {
		this.getSelectedList()
	}

	getSelectedList = () => {
		const self = this
		fetch('http://localhost:8080/selectedlist')
			.then((resp) => resp.json()).then((data) => { 
				self.setState({selectedListIndex: data.index})
			})
	}

	selectList(orderNumber) {
		const self = this
		const fetchData = { 
		    method: 'PUT', body: JSON.stringify({ orderNumber: orderNumber }),
		    headers: new Headers({
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest'
		    })
		}
		fetch('http://localhost:8080/selectlist', fetchData)
			.then((resp) => resp.json())
			.then((data) => {
				self.setState({selectedListIndex: orderNumber})
			});
	}

	trashCheckedItems() {
		console.log("fetch method in frontend")
		const self = this
		const fetchData = { 
		    method: 'DELETE', body: JSON.stringify({orderNumber: 0}),
		    headers: new Headers({
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest'
		    })
		}
		fetch('http://localhost:8080/items/trash/', fetchData)
			//.then((resp) => resp.json())
			.then((data) => {
				self.setState({updateChild: true})
			});
	}

	handleSelectList = (index) => {
		this.selectList(index)
	}

	handleEditListsFromNav = () => {
		this.setState({editMenu: !this.state.editMenu})
	}

	handleTrashCheckedItemsFromNav = () => {
		this.trashCheckedItems()
	}

	handleFocusOnLists = () => {
		this.setState({listsFocus: true})
	}

	handleFocusOnCurrentList = () => {
		this.setState({listsFocus: false})
	}

	handleUpdateComplete = () => {

		this.setState({updateChild: false})
	}

	render() {

		return (
			<div>
				<div>
					<NavBar
						editListsFromNav={this.handleEditListsFromNav.bind(this)}
						trashCheckedItemsFromNav={this.handleTrashCheckedItemsFromNav.bind(this)}>
					</NavBar>
				</div>
				<div style={{ display: 'inline-block', verticalAlign: 'top' }}>
					<Lists
						editMenu={this.state.editMenu}
						selectList={this.handleSelectList.bind(this)}
						selectedListIndex={this.state.selectedListIndex}
						listsFocus={this.state.listsFocus}
						focusOnLists={this.handleFocusOnLists.bind(this)}
						focusOnCurrentList={this.handleFocusOnCurrentList.bind(this)}>
					</Lists>
				</div>
				<div style={{ display: 'inline-block', verticalAlign: 'top' }}>
					<CurrentList
						focusOnLists={this.handleFocusOnLists.bind(this)}
						selectedListIndex={this.state.selectedListIndex}
						currentListFocused={this.state.listsFocus ? false : true}
						shouldChildUpdate={this.state.updateChild}
						updateComplete={this.handleUpdateComplete.bind(this)}>
					</CurrentList>
				</div>
			</div>
		)
	}
}

export default Home;




