
import React from 'react';
import ReactDOM from 'react-dom';
import AllistItem from './Allistitem';
import styles from './css/currentlist.css';

class CurrentList extends React.Component {

	state = {
		items: [],
		selectedItemIndex: null,
		width: null
	}

	divs = []
	textareas = []


	componentDidMount = () => {
		document.addEventListener('keydown', this.handleHotKeys)
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
		if(this.props.width != nextProps.width) {
			this.setState({width: nextProps.width})
		}
	}

	componentWillUnmount() {
		document.removeEventListener('keydown', this.handleHotKeys)
	}

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
		fetch('/items/', { headers: new Headers({authorization: 'Bearer ' + localStorage.getItem('access')})})
			.then((resp) => resp.json())
			.then((data) => {
				for(let i = 0; i < data.length; i++) {
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
					self.getSelectedItem()
				}))
			})
	}

	getSelectedItem = () => {
		const self = this
		const divs = this.divs
		fetch('/items/selected/', { headers: new Headers({authorization: 'Bearer ' + localStorage.getItem('access')})})
			.then((resp) => resp.json())
			.then((data) => {
				self.setState({selectedItemIndex: data.index}, (() => { if(self.props.currentListFocused) {
					divs[data.index].focus()
				}
			})
				)})
	}

	editItemTitle = (orderNumber, editedTitle) => {
		const fetchData = this.assignFetchData('PUT', { title: editedTitle, orderNumber: orderNumber })
		fetch('/items/', fetchData)
		.then(function() {});
		var editedList = this.state.items
		editedList[orderNumber].itemtitle = editedTitle
		this.setState({items: editedList}, () => {})
	}

	createItem(orderNumber) {
		const self = this
		let editedList = this.state.items, newItemOrderNum
		const fetchData = this.assignFetchData('POST', { orderNumber: orderNumber })
		fetch('/items/', fetchData)
			.then((resp) => resp.json())
			.then((data) => {
				newItemOrderNum = orderNumber + 1
				if(this.state.items[newItemOrderNum] && this.state.items[newItemOrderNum].hidden) {
					while(this.state.items[newItemOrderNum] && this.state.items[newItemOrderNum].hidden) newItemOrderNum++
				}
				editedList.splice(newItemOrderNum, 0, {primarykey: data._id, itemtitle: '', indentlevel: data.indentLevel})
				self.setState({items: editedList, selectedItemIndex: newItemOrderNum}, ()=>{
					self.handleFocusOnItem(newItemOrderNum, 'textarea')
				})
			});
	}

	deleteItem(orderNumber) {
		const self = this
		let editedList = this.state.items
		let newFocusItem
		const fetchData = this.assignFetchData('DELETE', { orderNumber: orderNumber })
		fetch('/items/', fetchData)
		.then(function() {
			const deletedIndentLevel = editedList[orderNumber].indentlevel
			editedList.splice(orderNumber, 1)
			for(let i = orderNumber; i < editedList.length; i++) {
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
		fetch('/items/tab/', fetchData)
		.then(function() {
			if(editedList[orderNumber-1].indentlevel >= editedList[orderNumber].indentlevel) {
				editedList[orderNumber].indentlevel += 1
				for(let i = orderNumber + 1; i < editedList.length; i++) {
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
		fetch('/items/untab/', fetchData)
		.then(function() {
			if(editedList[orderNumber].indentlevel != 0 && orderNumber != 0) {
				editedList[orderNumber].indentlevel -= 1
				for(let i = orderNumber+1; i < editedList.length; i++) {
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
		fetch('/items/selected/', fetchData)
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
		fetch('/items/check/', fetchData)
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
		fetch('/items/collapse/', fetchData)
			.then(resp => resp.json())
			.then((data) => {
				editedList[orderNumber].decollapsed = !this.state.items[orderNumber].decollapsed
				for(let i = 0; i < data.index.length; i++) {
					editedList[data.index[i]].hidden = !this.state.items[data.index[i]].hidden
				}
				self.setState({items: editedList})
			})
	}


	handleFocusOnItem = (orderNumber, action) => {
		if(action == 'div') this.divs[orderNumber].focus()
		if(action == 'textarea') this.textareas[orderNumber].focus()
	}

	handleAction = (orderNumber, action, editedTitle) => {
		switch (action) {
			case 'edit': {this.editItemTitle(orderNumber, editedTitle); break;}
			case 'delete': {
				if(this.state.items.length != 1) this.deleteItem(orderNumber); 
				break;
			}
			case 'select': {this.selectItem(orderNumber); break;}
			case 'focusDiv': {this.handleFocusOnItem(orderNumber, 'div'); break;}
		}
	}

	handleReOrder = (draggedPK, draggedON, droppedPK, droppedON) => {
		let fetchData = this.assignFetchData('PUT', { orderNumber: draggedON, newOrderNumber: droppedON })
		fetch('/items/reorder/', fetchData)
			.then(resp => resp.json())
			.then((data) => {})
		var editedList = this.state.items;
		let numChildrenDragged = 0, numChildrenDropped = 0;
		for(let i = draggedON + 1; i < editedList.length; i++) {
			if(editedList[i].indentlevel > editedList[draggedON].indentlevel) {
				numChildrenDragged++;
			}
			else break
		}
		for(let j = droppedON + 1; j < editedList.length; j++) {
			if(editedList[j].indentlevel > editedList[droppedON].indentlevel) {
				numChildrenDropped++;
			}
			else break
		}
		const dragged = editedList.splice(draggedON, numChildrenDragged + 1);
		editedList.splice(droppedON - (draggedON < droppedON ? (numChildrenDragged - numChildrenDropped) : 0), 0, ...dragged);
		this.setState({items: editedList}, () => {})
	}

	handleCreateRef(orderNumber, node, action) {
		if(action == 'div') this.divs[orderNumber] = node
		if(action == 'textarea') this.textareas[orderNumber] = node
	}

	hotKeyUp(e) {
		e.preventDefault()
		if(this.state.selectedItemIndex != 0) {
			let i = 1
			while(this.state.items[this.state.selectedItemIndex - i].hidden) {
				i++
			}
			this.selectItem(this.state.selectedItemIndex - i)
			this.divs[this.state.selectedItemIndex-i].focus()
		}
	}

	hotKeyDown(e) {
		e.preventDefault()
		if(this.state.selectedItemIndex != this.state.items.length-1) {
			let i = 1, visibleEnd = false
			while(this.state.items[this.state.selectedItemIndex + i].hidden) {
				//if(this.state.selectedItemIndex + i == this.state.items.length - 1) {
				if(this.state.items[this.state.selectedItemIndex + i + 1] == null) {
					visibleEnd = true
					break;
				}
				i++;
			}
			//if(this.state.selectedItemIndex + i != this.state.items.length-1 || (i == 1 && this.state.selectedItemIndex + i == this.state.items.length-1)) {
			if(this.state.selectedItemIndex + i <= this.state.items.length - 1 && !visibleEnd) {
				this.selectItem(this.state.selectedItemIndex + i)
				this.divs[this.state.selectedItemIndex+i].focus()
			}
		}
	}

	hotKeyLeft(e) {
		e.preventDefault()
		const { items } = this.state
		if(this.state.selectedItemIndex != items.length-1 
			&& items[this.state.selectedItemIndex].indentlevel < items[this.state.selectedItemIndex+1].indentlevel 
			&& !items[this.state.selectedItemIndex+1].hidden) {
			this.toggleCollapse(this.state.selectedItemIndex, 'decollapse'); 
		}
	}

	hotKeyShiftLeft() {
		this.props.focusOnLists()
	}

	hotKeyRight(e) {
		e.preventDefault()
		if(this.state.items[this.state.selectedItemIndex].decollapsed) this.toggleCollapse(this.state.selectedItemIndex)
	}


	hotKeyShiftEnter(e) {
		e.preventDefault()
		e.target.children[4].lastElementChild.focus()
	}

	hotKeyShiftBackspace() {
		if(this.state.items.length != 1) this.deleteItem(this.state.selectedItemIndex)
	}

	hotKeyEnter() {
		this.createItem(this.state.selectedItemIndex)
	}

	hotKeyTab() {
		this.tabItem(this.state.selectedItemIndex)
	}

	hotKeyShiftTab() {
		this.untabItem(this.state.selectedItemIndex)
	}

	hotKeyForwardSlash() {
		this.toggleCheckbox(this.state.selectedItemIndex)
	}

	handleHotKeys = (e) => {
		if(this.props.currentListFocused){
			if(e.target.type != "textarea") {
				if(e.shiftKey) {
					switch (e.key) {
						case 'Enter': {this.hotKeyShiftEnter(e); break;}
						case 'Backspace': {this.hotKeyShiftBackspace(); break}
						case 'Tab': {this.hotKeyShiftTab(); break}
						case 'ArrowLeft': {this.hotKeyShiftLeft(); break}
					}
				}
				else {
					switch (e.key) {
						case 'Enter': {this.hotKeyEnter(); break;}
						case 'Tab': {this.hotKeyTab(); break}
						case 'ArrowUp': {this.hotKeyUp(e); break}
						case 'ArrowDown': {this.hotKeyDown(e); break}
						case 'ArrowLeft': {this.hotKeyLeft(e); break}
						case 'ArrowRight': {this.hotKeyRight(e); break}
						case '/': {this.hotKeyForwardSlash(); break}
					}
				}
			}
		}
	}

	render() {
		return (
			<div className={styles.div}>
				<ul className={styles.ul}>
					{this.state.items.map((item, i) => (
						<div key={this.state.items[i].primarykey}>
							<div style = {{transform: 'translate3d(0, 0, 0)'}} className={this.state.items[i].hidden ? styles.hidden : styles.normal}>
								<AllistItem 
									style={{outline: '0'}}
									width={this.state.width}
									primaryKey = {this.state.items[i].primarykey}
									itemTitle={this.state.items[i].itemtitle} 
									orderNumber = {i} 
									indentLevel = {this.state.items[i].indentlevel}
									handleAction = {this.handleAction.bind(this)} 
									handleReOrder = {this.handleReOrder.bind(this)}
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
