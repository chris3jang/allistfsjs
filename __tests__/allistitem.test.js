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