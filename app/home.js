
import React from 'react';
import ReactDOM from 'react-dom';
import Lists from './Lists'
import CurrentList from './CurrentList'
import NavBar from './NavBar'
import styles from './home.css'

class Home extends React.Component {

	state = {
		username: this.props.username,
		selectedListIndex: null,
		editMenu: false,
		listsFocus: true,
		updateChild: false,
		clwidth: null
	}

	componentDidMount() {
		this.getSelectedList()
		//this.setState({clwidth: this.currentList.clientWidth})

		document.body.clientWidth
		window.addEventListener('resize', this.handleResize)
	}

	componentDidUpdate(prevProps, prevState) {
		if(this.currentList && prevState.clwidth != this.currentList.clientWidth) {
			this.setState({clwidth: this.currentList.clientWidth})
		}

	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize)
	}

	handleResize = (e) => {
		if(!this.state.listsFocus && this.currentList.clientWidth != this.state.clwidth) {
			this.setState({clwidth: this.currentList.clientWidth})
		}
	}

	getSelectedList = () => {
		const myHeaders = new Headers()
		myHeaders.append('authorization', 'Bearer ' + localStorage.getItem('access'))
		const self = this
		fetch('/lists/selected/', { headers: myHeaders })
			.then((resp) => resp.json()).then((data) => { 
				self.setState({selectedListIndex: data.index})
			})
	}

	selectList(orderNumber) {
		const self = this
		const fetchData = { 
		    method: 'PUT', body: JSON.stringify({ orderNumber: orderNumber }),
		    headers: new Headers({
		    	'authorization': 'Bearer ' + localStorage.getItem('access'),
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest'
		    })
		}
		fetch('/lists/selected/', fetchData)
			.then((resp) => {
				self.setState({selectedListIndex: orderNumber})
			});
	}

	trashCheckedItems() {
		const self = this
		const fetchData = { 
		    method: 'DELETE', body: JSON.stringify({orderNumber: 0}),
		    headers: new Headers({
		    	'authorization': 'Bearer ' + localStorage.getItem('access'),
		    	'content-type': 'application/json',
		    	'X-Requested-With': 'XMLHttpRequest'
		    })
		}
		fetch('/items/trash/', fetchData)
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

	handleLogout = () => {
		this.props.logout()
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
			<div className={styles.home}>
				<div>
					<NavBar
						trashCheckedItemsFromNav={this.handleTrashCheckedItemsFromNav.bind(this)}
						logout={this.handleLogout.bind(this)}>
					</NavBar>
				</div>
				<div style = {{ whiteSpace: 'nowrap', overflow: 'auto' }}>
					{this.state.listsFocus ?
					<div className={styles.l}>
						<Lists
							selectList={this.handleSelectList.bind(this)}
							selectedListIndex={this.state.selectedListIndex}
							listsFocus={this.state.listsFocus}
							focusOnLists={this.handleFocusOnLists.bind(this)}
							focusOnCurrentList={this.handleFocusOnCurrentList.bind(this)}>
						</Lists>
					</div>
					:
					<div className={styles.cl} ref={node => this.currentList = node}>
						<CurrentList
							focusOnLists={this.handleFocusOnLists.bind(this)}
							selectedListIndex={this.state.selectedListIndex}
							currentListFocused={this.state.listsFocus ? false : true}
							shouldChildUpdate={this.state.updateChild}
							updateComplete={this.handleUpdateComplete.bind(this)}
							width={this.state.clwidth}>
						</CurrentList>
					</div> }
				</div>
			</div>
		)
	}
}

export default Home;




