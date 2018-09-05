
import React from 'react';
import ReactDOM from 'react-dom';
import AllistItem from './Allistitem';
import styles from './lists.css';

/*
const React = require("react")
const ReactDom = require("react-dom")
const AllistItem = require("AllistItem")
*/

class Lists extends React.Component {

	state = { titles: [], editMenu: false, focused: false }

	inputs = []
	divs = []

	componentDidMount = () => {
		this.fetchFromAPI('fetch')
	}

	componentWillReceiveProps = (nextProps) => {
		if(this.state.editMenu != nextProps.editMenu) this.setState({editMenu: nextProps.editMenu})
		if(this.state.listsFocus != nextProps.listsFocus) {
			this.setState({focused: nextProps.listsFocus })
			if(nextProps.listsFocus) {
				this.divs[nextProps.selectedListIndex].focus()
			}
		}
	}

	fetchFromAPI = (action, params) => {

		const fetchList = (data) => {
			let fetchedData = []
			for(let i = 0; i < data.length; i++) {
				fetchedData[data[i].orderNumber] = data[i].listTitle
			}
			this.setState({titles: fetchedData})
		}

		const editList = (data, params) => {
			const orderNumber = params[0], editedTitle = params[1]
			let editedLists = this.state.titles
			editedLists[orderNumber] = editedTitle
			this.setState({items: editedLists})
		}

		const createList = (data, params) => {
			const orderNumber = params[0]
			let editedLists = this.state.titles
			editedLists.splice(orderNumber+1, 0, "")
			this.setState({titles: editedLists})
			
		}

		const deleteList = (data, params) => {
			const orderNumber = params[0]
			let editedLists = this.state.titles
			editedLists.splice(orderNumber, 1)
			this.setState({titles: editedLists})
			this.props.selectList(orderNumber-1)
		}

		const assignFetchData = (method, paramData) => {
			return { method: method, body: JSON.stringify(paramData), 
				headers: new Headers({
				'authorization': 'Bearer ' + localStorage.getItem('access'),
				'content-type': 'application/json',
				'X-Requested-With': 'XMLHttpRequest'
			})}
		}

		const url = '/lists/'
		let resFunc, paramData, fetchData

		switch(action) {
			case 'fetch': {
				resFunc = fetchList
				fetchData = { headers: new Headers({ authorization: 'Bearer ' + localStorage.getItem('access')})}
				break
			}
			case 'edit': {
				resFunc = editList
				paramData = { title: params[1], ordernumber: params[0] }
				fetchData = assignFetchData('PUT', paramData)
				break
			}
			case 'create': {
				resFunc = createList
				paramData = { orderNumber: params[0]}
				fetchData = assignFetchData('POST', paramData)
				break
			}
			case 'delete': {
				resFunc = deleteList
				paramData = { orderNumber: params[0]}
				fetchData = assignFetchData('DELETE', paramData)
				break
			}
		}

		fetch(url, fetchData).then((resp) => resp.json()).then((data) => {
			resFunc(data, params)
		})

	}

	handleDivClick = (i, event) => {
		this.props.focusOnLists()
		this.props.selectList(i)
		this.divs[i].focus()
		event.stopPropagation()
	}

	handleDivKeyDown = (i, event) => {
		if(event.currentTarget.tagName == "DIV") {
			if(event.key == 'ArrowUp' && i != 0) {
				this.props.selectList(i - 1)
				this.divs[i - 1].focus()
			}
			if(event.key == 'ArrowDown' && i != this.state.titles.length - 1) {
				this.props.selectList(i + 1)
				this.divs[i + 1].focus()
			}
			if(event.key == 'ArrowRight' && event.shiftKey) this.props.focusOnCurrentList()
			if(event.key == 'Enter') {
				if(event.shiftKey) this.inputs[i].focus()//this.props.handleAction(orderNumber, 'focusInput')
				else this.fetchFromAPI('create', [i])
			}
			if(event.key == 'Backspace' && event.shiftKey && event.altKey) {
				this.fetchFromAPI('delete', [i])
			}
		}
	}

	handleOnChange = (i, event) => {
		if(event.key != 'Backspace' || event.target.value) this.fetchFromAPI('edit', [i, event.target.value])
	}

	handleInputKeyDown = (orderNumber, event) => {
		event.stopPropagation()
		if(event.key == 'Enter') this.divs[orderNumber].focus()
		if(event.key == 'Backspace' && !event.target.value) this.fetchFromAPI('delete', [orderNumber])
		if(event.key == 'ArrowUp') if(orderNumber != 0) this.handleArrowKey(orderNumber, 'up')
  		if(event.key == 'ArrowDown') this.handleArrowKey(orderNumber, 'down')
	}

	handleArrowKey = (orderNumber, action) => {
		if(action == 'up') this.inputs[orderNumber-1].focus()
		if(action == 'down' && orderNumber != this.state.titles.length-1) this.inputs[orderNumber+1].focus()
	}

	handleInputClick = (event) => {
		event.preventDefault()
		event.stopPropagation()
	}

	handleRefCreate(node, orderNumber, action) {
		if(action == 'div') this.divs[orderNumber] = node
		if(action == 'input') this.inputs[orderNumber] = node
	}

	render() {

		return (
			<div>
				<ul className={styles.ul}>
					{this.state.titles.map((title, i) => (
						<div key={i/*removes warning but may need to be changed*/} 
							tabIndex="0" 
							onClick={this.handleDivClick.bind(this, i)}
							onKeyDown={this.handleDivKeyDown.bind(this, i)}
							ref = {node => this.handleRefCreate(node, i, 'div')}>
							<input 
								disabled={this.props.selectedListIndex != i }
								className={this.state.focused && this.props.selectedListIndex == i 
									? styles.focused 
									: this.props.selectedListIndex == i 
									? styles.selected 
									: styles.itemTextInput} 
								type="text" 
								value={title} 
								onChange={this.handleOnChange.bind(this, i)}
								onKeyDown={this.handleInputKeyDown.bind(this, i)}
								onClick={this.handleInputClick.bind(this)}
								ref = {node => this.handleRefCreate(node, i, 'input')}>
							</input>
						</div>
					))}
				</ul>
			</div>
		)
	}
}

export default Lists;
