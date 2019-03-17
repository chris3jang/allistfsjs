import React from 'react';
import ReactDOM from 'react-dom';
import AllistItem from '../app/allistitem.js';

import { mount, shallow } from 'enzyme';

const props = {
	style: {outline: '0'},
	itemTitle: "",
	orderNumber: 0,
	indentLevel: 0,
	selected: true,
	checked: false,
	hidden: false
}

const wrapper = shallow(<AllistItem {...props} />);

describe('<first test', () => {
	it('first allistitem test', () => {
		expect(1).toBe(1);
	});
});

/*
style={{outline: '0'}}
width={this.state.width}
primaryKey = {this.state.items[i].primarykey}
itemTitle={this.state.items[i].itemtitle} 
orderNumber = {i} 
indentLevel = {this.state.items[i].indentlevel}
handleAction = {this.handleAction.bind(this)} 
createRef = {this.handleCreateRef.bind(this)}
selected = {i == this.state.selectedItemIndex}
checked={this.state.items[i].checked}
hidden={this.state.items[i].hidden}
decollapsed={this.state.items[i].decollapsed}
*/