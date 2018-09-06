
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './allistitem.css';

class AllistItem extends React.Component {

	state = {
		height: 51
	}

	componentDidMount = () => {
		console.log("allistitem cdm")
		this.textArea.style = 'height: auto'
		console.log("this.textArea.scrollHeight", this.textArea.scrollHeight)
		this.textArea.style = 'height: ' + (this.textArea.scrollHeight) + 'px; width: ' + this.props.width
		this.setState({height: this.textArea.scrollHeight})
	}

	/*
	componentWillReceiveProps = (nextProps) => {
		if(this.props.width != nextProps.width) {
			this.textArea.style = 'height: ' + (this.textArea.scrollHeight) + 'px;'
			console.log("this.textArea.style", this.textArea.style)
			this.setState({height: this.textArea.scrollHeight})
		}
		if(this.props.hidden != nextProps.hidden) {
			console.log("changed")
			console.log(this.textArea)
			this.textArea.style = 'height: auto'
			console.log("this.textArea.scrollHeight", this.textArea.scrollHeight)
			this.textArea.style = 'height: ' + (this.textArea.scrollHeight) + 'px;'
			consolle.log(this.textArea.styles)
			this.setState({height: this.textArea.scrollHeight})
		}
		
	}
	*/

	componentDidUpdate = (prevProps) => {
		console.log('cDU')
		if(this.props.hidden != prevProps.hidden) {
			console.log("***********************")
			this.textArea.style = 'height: auto'
			console.log("this.textArea.scrollHeight", this.textArea.scrollHeight)
			this.textArea.style = 'height: ' + (this.textArea.scrollHeight) + 'px; width: ' + this.props.width
			this.setState({height: this.textArea.scrollHeight})
		}
		if(this.props.width != prevProps.width) {
			console.log("this.props.width", this.props.width)
			console.log("prevProps.width", prevProps.width)
			console.log("&&&&&&&&&&&&&&&&&&&&&&&&")
			this.textArea.style = 'height: auto'
			console.log("this.textArea.scrollHeight", this.textArea.scrollHeight)
			this.textArea.style = 'height: ' + (this.textArea.scrollHeight) + 'px; width: ' + this.props.width
			this.setState({height: this.textArea.scrollHeight})
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

	handleTextAreaKeyDown = (e) => {
		const {orderNumber} = this.props
		e.stopPropagation()
 		if(e.key == 'Enter') {
 			this.props.handleAction(this.props.orderNumber, 'edit', e.target.value)
 			this.props.handleAction(orderNumber, 'focusDiv')
 		}
  		if(e.key == 'Backspace' && !e.target.value) this.props.handleAction(orderNumber, 'delete')
	}

	handleInputChange = (event) => {
		if(event.key != 'Backspace' || event.target.value) {
			this.props.handleAction(this.props.orderNumber, 'edit', event.target.value)
		}
	}

	handleTextAreaChange = (e) => {
		if(e.key != 'Backspace' || e.target.value) {
			this.props.handleAction(this.props.orderNumber, 'edit', e.target.value)
		}
		console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^")
		e.target.style = 'height: auto'
		console.log("e.target.scrollHeight", e.target.scrollHeight)
		e.target.style = 'height: ' + (e.target.scrollHeight) + 'px; width: ' + this.props.width
		this.setState({height: e.target.scrollHeight})		
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

	handleTextAreaClick = (e) => {
		e.preventDefault()
		e.stopPropagation()
	}

	handleRefCreate = (node, action) => {
		if(action == 'textarea') this.textArea = node;
		this.props.createRef(this.props.orderNumber, node, action);
	}

	handleCheckboxClick = () => {
		this.props.handleAction(this.props.orderNumber, 'toggle')
	}


	render() {
		return (
			<div className={styles.fulldiv} style={{whiteSpace: 'nowrap'}} tabIndex="0"
				onClick={this.handleDivClick.bind(this)}
				ref = {node => this.handleRefCreate(node, 'div')}>
				<div className={this.props.decollapsed ? (this.props.checked ? styles.divcollapsedcheckboxchecked : styles.divcollapsedcheckboxunchecked) : (this.props.checked ? styles.divcheckboxchecked : styles.divcheckboxunchecked)} 
					onClick={this.handleCheckboxClick.bind(this)}>
				</div>
				<input type="checkbox" className="chkbx-input"
					checked={this.props.checked} 
					onClick={this.handleCheckboxClick.bind(this)}>
				</input>
				<textarea 
					rows={1}
					style={{width: this.props.width}}
					className={this.props.selected ? styles.selectedTextArea : styles.nonSelectedTextArea} 
					disabled={!this.props.selected} 
					value={this.props.itemTitle}
					onChange={this.handleTextAreaChange.bind(this)}
					onKeyDown={this.handleTextAreaKeyDown.bind(this)}
					onClick={this.handleTextAreaClick.bind(this)}
					ref = {node => this.handleRefCreate(node, 'textarea')}
					tabIndex="-1">
				</textarea>
			</div>
		)
	}
}

export default AllistItem;