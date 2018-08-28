
import React from 'react';
import ReactDOM from 'react-dom';
import AllistItem from './Allistitem'
import styles from './currentlist.css';

class CurrentList extends React.Component {

	state = {
		items: [],
		selectedItemIndex: null
	}

	divs = []
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
		    	'authorization': 'Bearer ' + localStorage.getItem('access'),
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest',
		    })
		}
	}
	
	fetchItems = () => {
		let fetchedData = []
		const self = this
		fetch('http://localhost:8080/items', { headers: new Headers({authorization: 'Bearer ' + localStorage.getItem('access')})})
			.then((resp) => resp.json())
			.then((data) => {
				for(var i = 0; i < data.length; i++) {
					fetchedData[data[i].orderNumber] = {
						primarykey: data[i]._id, 
						itemtitle: data[i].itemTitle, 
						indentlevel: data[i].indentLevel, 
						checked: data[i].checked ? data[i].checked : false, 
						decollapsed: data[i].decollapsed ? data[i].decollapsed : false,
						hidden: data[i].hidden ? data[i].hidden : false
					}
				}
				self.setState({items: fetchedData}, (() => {
					console.log("getSelectedItem post fetch")
					self.getSelectedItem()
				}))
			})
	}

	getSelectedItem = () => {
		console.log("getSelectedItem")
		const self = this
		const divs = this.divs
		fetch('http://localhost:8080/items/selected', { headers: new Headers({authorization: 'Bearer ' + localStorage.getItem('access')})})
			.then((resp) => resp.json())
			.then((data) => {
				console.log("getSelectedItem", data)
				self.setState({selectedItemIndex: data.index}, (() => { if(self.props.currentListFocused) {
					divs[data.index].focus()
				}
			})
				)})
	}

	editItemTitle = (orderNumber, editedTitle) => {
		const fetchData = this.assignFetchData('PUT', { title: editedTitle, orderNumber: orderNumber })
		fetch('http://localhost:8080/items', fetchData)
		.then(function() {});
		var editedList = this.state.items
		editedList[orderNumber].itemtitle = editedTitle
		this.setState({items: editedList}, () => {})
	}

	createItem(orderNumber) {
		const self = this
		let editedList = this.state.items
		const fetchData = this.assignFetchData('POST', { orderNumber: orderNumber })
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
		const fetchData = this.assignFetchData('PUT', { orderNumber: orderNumber })
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
		let fetchData = this.assignFetchData('PUT', { orderNumber: orderNumber })
		fetch('http://localhost:8080/items/untab', fetchData)
		.then(function() {
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
		fetch('http://localhost:8080/items/selected/', fetchData)
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

	toggleCollapse = (orderNumber, action) => {
		let editedList = this.state.items
		const self = this
		const decollapsed = this.state.items[orderNumber].decollapsed
		let fetchData = this.assignFetchData('PUT', { orderNumber: orderNumber, decollapsed: decollapsed })
		fetch('http://localhost:8080/items/collapse', fetchData)
			.then(resp => resp.json())
			.then((data) => {
				console.log("toggleCollapse callback")
				editedList[orderNumber].decollapsed = !this.state.items[orderNumber].decollapsed
				for(let i = 0; i < data.index.length; i++) {
					editedList[data.index[i]].hidden = !this.state.items[data.index[i]].hidden
				}
				self.setState({items: editedList})
			})
	}

	handleAction = (orderNumber, action, editedTitle) => {
		switch (action) {
			case 'edit': {this.editItemTitle(orderNumber, editedTitle); break;}
			case 'create': {this.createItem(orderNumber); break;}
			case 'delete': {
				if(this.state.items.length != 1) this.deleteItem(orderNumber); 
				break;
			}
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
			case 'collapse': {
				if(this.state.items[orderNumber].decollapsed) this.toggleCollapse(orderNumber); 
				break;
			}
			case 'decollapse': {
				console.log("here")
				const { items } = this.state
				console.log(items[orderNumber])
				console.log(items[orderNumber+1].indentlevel)
				if(orderNumber != items.length-1 
					&& items[orderNumber].indentlevel < items[orderNumber+1].indentlevel 
					&& !items[orderNumber+1].hidden) {
					this.toggleCollapse(orderNumber, 'decollapse'); 
				}
				break;
			}
		}
	}


	handleArrowKey(orderNumber, action) {
		if(action == 'up') {
			let i = 1
			while(this.state.items[orderNumber - i].hidden) {
				i++
			}
			this.selectItem(orderNumber - i)
			this.divs[orderNumber-i].focus()
		}
		if(action == 'down' && orderNumber != this.state.items.length-1) {
			let i = 1
			while(this.state.items[orderNumber + i].hidden) {
				if(orderNumber + i == this.state.items.length - 1) break;
				i++;
			}
			if(orderNumber + i != this.state.items.length-1 || (i == 1 && orderNumber + i == this.state.items.length-1)) {
				this.selectItem(orderNumber + i)
				this.divs[orderNumber+i].focus()
			}
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
		if(action == 'textarea') this.textareas[orderNumber] = node
	}

	render() {

		return (
			<div>
			<ul style={{ display: 'inline-block', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
				{this.state.items.map((item, i) => (
					<div key={this.state.items[i].primarykey} style={{textIndent: this.state.items[i].indentlevel * 40}} >
						<div className={this.state.items[i].hidden ? styles.hidden : styles.normal}>
							<AllistItem 
								style={{outline: '0'}}
								primaryKey = {this.state.items[i].primarykey}
								itemTitle={this.state.items[i].itemtitle} 
								orderNumber = {i} 
								indentLevel = {this.state.items[i].indentlevel}
								handleAction = {this.handleAction.bind(this)} 
								createRef = {this.handleCreateRef.bind(this)}
								selected = {i == this.state.selectedItemIndex}
								checked={this.state.items[i].checked}
								hidden={this.state.items[i].hidden}
								decollapsed={this.state.items[i].decollapsed}>
							</AllistItem>
						</div>
					</div>
				))}
			</ul>
			</div>
		)
	}
}

export default CurrentList;




