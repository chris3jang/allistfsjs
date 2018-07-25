
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './allistitem.css';

class AllistItem extends React.Component {

	handleDivKeyDown = (e) => {
		const {orderNumber} = this.props
		if(e.currentTarget.tagName == "DIV") {
			if(e.key == 'Enter') {
				if(e.shiftKey) this.props.handleAction(orderNumber, 'focusInput')
				else {
					this.props.handleAction(orderNumber, 'create')
				}
			}
	  		if(e.key == 'ArrowUp' && orderNumber != 0) this.props.handleAction(orderNumber, 'arrowUp')
	  		if(e.key == 'ArrowDown') this.props.handleAction(orderNumber, 'arrowDown')
	  		if(e.key == 'ArrowLeft') this.props.handleAction(orderNumber, 'arrowLeft')
	  		if(e.key == 'Backspace' && e.shiftKey) this.props.handleAction(orderNumber, 'delete')
	  		if(e.key == 'Tab') {
	  			e.preventDefault()
	  			if(e.shiftKey) {
	  				this.props.handleAction(orderNumber, 'untab')
	  			}
	  			else {
	  				this.props.handleAction(orderNumber, 'tab')
	  			}
	  		}
	  		if(e.key == '/') this.props.handleAction(orderNumber, 'toggle')
		}
	}

	handleInputKeyDown = (event) => {
		const {orderNumber} = this.props
		event.stopPropagation()
 		if(event.key == 'Enter') {
 			this.props.handleAction(orderNumber, 'focusDiv')
  		}

  		if(event.key == 'Backspace' && !event.target.value) {
  			this.props.handleAction(orderNumber, 'delete')
  		}

	}

	handleChange = (event) => {
		if(event.key != 'Backspace' || event.target.value) {
			this.props.handleAction(this.props.orderNumber, 'edit', event.target.value)
		}
	}

	handleDivClick = (event) => {
		const {orderNumber} = this.props
		this.props.handleAction(orderNumber, 'select')
		event.stopPropagation()
	}

	handleInputClick = (event) => {
		event.preventDefault()
		event.stopPropagation()
	}

	handleRefCreate = (node, action) => {
		this.props.createRef(this.props.orderNumber, node, action)
	}

	handleCheckboxClick = () => {
		this.props.handleAction(this.props.orderNumber, 'toggle')
	}

	handleCheckBoxChange = () => {}


	render() {

		// key={this.props.primaryKey}

		return (
			<div className={styles.fulldiv} style={{whiteSpace: 'nowrap'}} tabIndex="0"
				onClick={this.handleDivClick.bind(this)}
				onKeyDown={this.handleDivKeyDown.bind(this)}
				ref = {node => this.handleRefCreate(node, 'div')}>
				<div className={this.props.checked ? styles.divcheckboxchecked : styles.divcheckboxunchecked} 
					onClick={this.handleCheckboxClick.bind(this)}>
				</div>
				<input type="checkbox" className="chkbx-input"
					checked={this.props.checked} 
					onClick={this.handleCheckboxClick.bind(this)} 
					onChange={this.handleCheckBoxChange.bind(this)}>
				</input>
				<input type="text" 
					className={this.props.selected ? styles.selected : styles.itemTextInput}
					disabled={!this.props.selected}
					value={this.props.itemTitle}
					onChange={this.handleChange.bind(this)} 
					onKeyDown={this.handleInputKeyDown.bind(this)}
					onClick={this.handleInputClick.bind(this)}
					ref = {node => this.handleRefCreate(node, 'input')}
					tabIndex="-1">
				</input>
			</div>
		)
	}
}

export default AllistItem;


/*
	state = {
		itemTitle: this.props.itemTitle,
		orderNumber: this.props.orderNumber,
		selected: this.props.selected,
		checked: this.props.checked
		//indentLevel: this.props.indentLevel
	}

	componentWillReceiveProps(nextProps) {
		const { itemTitle, orderNumber } = this.state
		//as a result of editItemTitle callback
		if(itemTitle != nextProps.itemTitle) {
			this.setState({itemTitle: nextProps.itemTitle})
		}
		if(this.state.orderNumber != nextProps.orderNumber) {
			this.setState({orderNumber: nextProps.orderNumber})
		}
		if(this.state.selected != nextProps.selected)
			this.setState({selected: nextProps.selected})
		if(this.state.checked != nextProps.checked)
			this.setState({checked: nextProps.checked})
		
		if(this.state.indentLevel != nextProps.indentLevel) {
			this.setState({indentLevel: nextProps.indentLevel})
		}
		
	}
	*/