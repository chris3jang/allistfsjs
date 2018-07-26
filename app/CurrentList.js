
import React from 'react';
import ReactDOM from 'react-dom';
import AllistItem from './Allistitem'

class CurrentList extends React.Component {

	state = {
		items: [],
		selectedItemIndex: null
	}

	divs = []
	inputs = []
	textareas = []

	componentDidMount = () => {
		this.fetchItems()
	}

	componentWillReceiveProps = (nextProps) => {
		if(this.props.selectedListIndex != nextProps.selectedListIndex || 
		this.props.currentListFocused != nextProps.currentListFocused) {
			this.fetchItems()
		}
		if(nextProps.shouldChildUpdate) {
			console.log("cwp do i get here after trashing")
			this.fetchItems()
			this.props.updateComplete()
		}
	}

	/*
	shouldComponentUpdate = (nextProps, nextState) => {
		if(nextProps.shouldChildUpdate == true) return true
	}
	*/

	assignFetchData = (method, paramData) => {
		return { method: method, body: JSON.stringify(paramData),
		    headers: new Headers({
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest',
		    })
		}
	}
	
	fetchItems = () => {
		let fetchedData = []
		const self = this
		fetch('http://localhost:8080/fetchitems')
			.then((resp) => resp.json())
			.then((data) => {
				for(var i = 0; i < data.length; i++) {
					fetchedData[data[i].orderNumber] = {primarykey: data[i]._id, itemtitle: data[i].itemTitle, indentlevel: data[i].indentLevel, checked: data[i].checked ? data[i].checked : false}
				}
				self.setState({items: fetchedData}, (() => {self.getSelectedItem()}))
			})
	}

	getSelectedItem = () => {
		const self = this
		const divs = this.divs
		fetch('http://localhost:8080/selecteditem')
			.then((resp) => resp.json())
			.then((data) => {
				self.setState({selectedItemIndex: data.index}, (() => { if(self.props.currentListFocused) divs[data.index].focus()}))
			})
	}

	editItemTitle = (orderNumber, editedTitle) => {
		const fetchData = this.assignFetchData('PUT', { itemtitle: editedTitle, ordernumber: orderNumber })
		fetch('http://localhost:8080/items', fetchData)
		.then(function() {});
		var editedList = this.state.items
		editedList[orderNumber].itemtitle = editedTitle
		this.setState({items: editedList}, () => {})
	}

	createItem(orderNumber) {
		const self = this
		let editedList = this.state.items
		const fetchData = this.assignFetchData('POST', { orderNumberEntered: orderNumber })
		fetch('http://localhost:8080/items', fetchData)
			.then((resp) => resp.json())
			.then((data) => {
				console.log(data)
				editedList.splice(orderNumber+1, 0, {primarykey: data._id, itemtitle: '', indentlevel: data.indentLevel})
				self.setState({items: editedList, selectedItemIndex: orderNumber+1}, ()=>{
					self.handleFocusOnItem(orderNumber+1, 'textarea')
				})
			});
	}

	deleteItem(orderNumber) {
		const self = this
		let editedList = this.state.items
		let newFocusItem
		const fetchData = this.assignFetchData('DELETE', { orderNumber: orderNumber })
		fetch('http://localhost:8080/items/', fetchData)
		.then(function() {
			var deletedIndentLevel = editedList[orderNumber].indentlevel
			editedList.splice(orderNumber, 1)
			for(var i = orderNumber; i < editedList.length; i++) {
				if(editedList[i].indentlevel > deletedIndentLevel) {
					editedList[i].indentlevel -= 1
				}
				else break
			}
			if(orderNumber == 0) newFocusItem = 0
			else newFocusItem = orderNumber-1
			self.setState({items: editedList, selectedItemIndex: newFocusItem}, ()=> {
				self.handleFocusOnItem(newFocusItem, 'div')
			})
		});
	}

	tabItem(orderNumber) {
		const self = this
		let editedList = this.state.items
		const fetchData = this.assignFetchData('PUT', { ordernumber: orderNumber })
		fetch('http://localhost:8080/items/tab', fetchData)
		.then(function() {
			console.log(editedList[orderNumber-1].indentlevel)
			console.log(editedList[orderNumber].indentlevel)
			if(editedList[orderNumber-1].indentlevel >= editedList[orderNumber].indentlevel) {
				editedList[orderNumber].indentlevel += 1
				for(var i = orderNumber + 1; i < editedList.length; i++) {
					if(editedList[i].indentlevel >= editedList[orderNumber].indentlevel) {
						editedList[i].indentlevel += 1
					}
					else break
				}
			}
			self.setState({items: editedList})
		});
	}

	untabItem(orderNumber) {
		const self = this
		let editedList = this.state.items
		let fetchData = this.assignFetchData('PUT', { ordernumber: orderNumber })
		fetch('http://localhost:8080/items/untab', fetchData)
		.then(function() {``
			console.log(editedList[orderNumber].indentlevel)
			console.log(orderNumber)
			if(editedList[orderNumber].indentlevel != 0 && orderNumber != 0) {
				editedList[orderNumber].indentlevel -= 1
				for(var i = orderNumber+1; i < editedList.length; i++) {
					if(editedList[i].indentlevel > editedList[orderNumber].indentlevel + 1) {
						editedList[i].indentlevel -= 1
					}
					else break
				}
			}
			self.setState({items: editedList})
		});
	}

	selectItem(orderNumber) {
		const self = this
		let fetchData = this.assignFetchData('PUT', { orderNumber: orderNumber })
		fetch('http://localhost:8080/selectitem', fetchData)
		.then(function() {
			self.setState({selectedItemIndex: orderNumber})
		});
	}

	toggleCheckbox(orderNumber) {
		const self = this
		let editedList = this.state.items
		let checked
		if(editedList[orderNumber].checked) checked = false
		else checked = true
		let fetchData = this.assignFetchData('PUT', { orderNumber: orderNumber, checked: checked })
		fetch('http://localhost:8080/items/check', fetchData)
		.then(() => {
			editedList[orderNumber].checked = !editedList[orderNumber].checked
			self.setState({items: editedList})
		});
	}

	handleAction = (orderNumber, action, editedTitle) => {
		switch (action) {
			case 'edit': {this.editItemTitle(orderNumber, editedTitle); break;}
			case 'create': {this.createItem(orderNumber); break;}
			case 'delete': {this.deleteItem(orderNumber); break;}
			case 'tab': {this.tabItem(orderNumber); break;}
			case 'untab': {this.untabItem(orderNumber); break;}
			case 'select': {this.selectItem(orderNumber); break;}
			case 'arrowUp': {this.handleArrowKey(orderNumber, 'up'); break;}
			case 'arrowDown': {this.handleArrowKey(orderNumber, 'down'); break;}
			case 'arrowLeft': {this.handleArrowKey(orderNumber, 'left'); break;}
			case 'focusDiv': {this.handleFocusOnItem(orderNumber, 'div'); break;}
			case 'focusInput': {this.handleFocusOnItem(orderNumber, 'input'); break;}
			case 'focusTextArea': {this.handleFocusOnItem(orderNumber, 'textarea'); break;}
			case 'toggle': {this.toggleCheckbox(orderNumber); break;}
		}
	}

	handleArrowKey(orderNumber, action) {
		if(action == 'up') {
			this.selectItem(orderNumber - 1)
			this.divs[orderNumber-1].focus()
		}
		if(action == 'down' && orderNumber != this.state.items.length-1) {
			this.selectItem(orderNumber + 1)
			this.divs[orderNumber+1].focus()
		}
		if(action == 'left') {
			this.props.focusOnLists()
		}
	}

	handleFocusOnItem = (orderNumber, action) => {
		if(action == 'div') this.divs[orderNumber].focus()
		if(action == 'input') this.inputs[orderNumber].focus()
		if(action == 'textarea') this.textareas[orderNumber].focus()
	}

	handleCreateRef(orderNumber, node, action) {
		if(action == 'div') this.divs[orderNumber] = node
		if(action == 'input') this.inputs[orderNumber] = node
		if(action == 'textarea') this.textareas[orderNumber] = node
	}

	render() {

		return (
			<div>
			<ul style={{ display: 'inline-block', verticalAlign: 'top' }}>
				{this.state.items.map((item, i) => (
					<div key={this.state.items[i].primarykey} style={{textIndent: this.state.items[i].indentlevel * 40}} >
						<AllistItem 
							style={{outline: '0'}}
							primaryKey = {this.state.items[i].primarykey}
							itemTitle={this.state.items[i].itemtitle} 
							orderNumber = {i} 
							indentLevel = {this.state.items[i].indentlevel}
							handleAction = {this.handleAction.bind(this)} 
							createRef = {this.handleCreateRef.bind(this)}
							selected = {i == this.state.selectedItemIndex}
							checked={this.state.items[i].checked}>
						</AllistItem>
					</div>
				))}
			</ul>
			</div>
		)
	}
}

export default CurrentList;




