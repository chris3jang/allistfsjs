import React from 'react';
import ReactDOM from 'react-dom';
import Checkbox from './Checkbox';
import styles from './css/allistitem.css';

import { ItemTypes } from './Constants';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import _ from 'lodash';

const itemSource = {
	beginDrag(props, monitor, component) {
		console.log("beganDrag", props)
		return { id: props.primaryKey, on: props.orderNumber, properties: props }
	}
}

const itemTarget = {
	drop(props, monitor) {
		props.handleReOrder(monitor.getItem().id, monitor.getItem().on, props.primaryKey, props.orderNumber)
	}
}

const sourceCollect = (connect, monitor) => {
	return {
		connectDragSource: connect.dragSource(),
		connectDragPreview: connect.dragPreview(),
		isDragging: monitor.isDragging()
	}
}

const targetCollect = (connect, monitor) => {
	return {
	    connectDropTarget: connect.dropTarget(),
	    isOver: monitor.isOver()
	}
}

class AllistItem extends React.Component {

	state = {
		height: 51
	}

	adjustHeight = (el) => {
		el.style = 'height: auto'
		el.style = 'height: ' + (el.scrollHeight) + 'px; width:' + (this.props.width - (this.props.decollapsed ? 36 : 28 + (this.props.indentLevel * 40)))
		this.setState({height: el.scrollHeight})
	}

	componentDidMount = () => {
		const { connectDragPreview } = this.props
	    if (connectDragPreview) {
	      connectDragPreview(getEmptyImage(), {
	        captureDraggingState: true,
	      })
	    }
		this.adjustHeight(this.textArea)
	}
	

	componentDidUpdate = (prevProps) => {
		if(this.props.hidden != prevProps.hidden || this.props.width != prevProps.width || this.props.indentLevel != prevProps.indentLevel || this.props.decollapsed != prevProps.decollapsed) {
			this.adjustHeight(this.textArea)
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
		this.adjustHeight(e.target)	
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
		if(this.props.createRef) {
			this.props.createRef(this.props.orderNumber, node, action);
		}
	}

	handleCheckboxClick = () => {
		this.props.handleAction(this.props.orderNumber, 'toggle')
	}

	render() {
		const { connectDragSource, connectDropTarget, connectDragPreview, isDragging } = this.props;
		return connectDropTarget(
				<div className={styles.fulldiv} style={{ whiteSpace: 'nowrap', opacity: isDragging ? .5 : 1 }} tabIndex="0"
					onClick={this.handleDivClick.bind(this)}
					ref = {node => this.handleRefCreate(node, 'div')}>
					<div style={{ display: 'inline-block', width: this.props.indentLevel * 40}}></div>
					{connectDragSource(<div style={{ display: 'inline-block', position: 'relative', bottom: 14, backgroundColor: 'black', height: 20, width: 4, marginRight: 4, cursor: 'move'}}></div>)}
					<Checkbox isHidingChildren = {this.props.decollapsed} isChecked = {this.props.checked} click = {this.handleCheckboxClick.bind(this)}></Checkbox>
					<input type="checkbox" className="chkbx-input"
						checked={this.props.checked} 
						onClick={this.handleCheckboxClick.bind(this)}>
					</input>
					<div style={{width: this.props.width - (this.props.decollapsed ? 36 : 28 + (this.props.indentLevel * 40)), display: 'inline-block'}}>
						<textarea 
							rows={1}
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
				</div>
		)
	}
}

export default _.flow([DragSource(ItemTypes.ITEM, itemSource, sourceCollect), DropTarget(ItemTypes.ITEM, itemTarget, targetCollect)])(AllistItem);