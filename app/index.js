import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

import { DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import jss from 'jss';
import preset from 'jss-preset-default';
import { SheetsRegistry, JssProvider } from 'react-jss';

const setupJss = () => {
	jss.setup(preset());
	const sheetsRegistry = new SheetsRegistry();
	const globalStyleSheet = jss.createStyleSheet(
	  {'@global': { body: { margin: 0 }}}
	).attach();
	sheetsRegistry.add(globalStyleSheet);
	return sheetsRegistry;
}
  
const sheets = setupJss();

ReactDOM.render(
	<JssProvider registry={sheets}>
		<DragDropContextProvider backend={HTML5Backend}>
			<App/>
		</DragDropContextProvider>
	</JssProvider>
	, 
	document.getElementById('root')
);
