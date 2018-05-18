# react wireframer

build wireframes with your react components!

[Demo](http://react-wireframer.surge.sh)

`npm i react-wireframer`


To have all props available for editing live (in development), make sure your components have propTypes defined. All defined proptypes will be exposed when clicking on the component in the app.

Try dragging & dropping.

Try cmd + z for undo.

Try alt + drag for copy.
## how to use it
Make sure to call `createLayouter` with an instance of prop-types installed from our own fork. It provides some extra magic in development mode, that extract all the possible types of props (yes, even enums for dropdowns!).


You can install this prop-types fork by putting the following in your package.json file:

`"prop-types": "git+https://github.com/ambewas/prop-types.git",`
```js

import React, { Component } from "react";
import PropTypes from "prop-types";

import Row from "./components/row";
import Button from "./components/button";
import ClassComponent from "./components/class";

import {createLayouter} from "react-wireframer";

const Layouter = createLayouter(PropTypes);

class Main extends Component { // eslint-disable-line
	constructor() {
		super();
		this.state = {
			hierarchy: [/* some default hierarchy*/],
		};
	}
	render() {
		return (
			<Layouter
				hierarchy={this.state.hierarchy}
				onChange={hierarchy => {
					this.setState({ hierarchy });
				}}
				components={{ Button, Row, ClassComponent }}
			/>
		);
	}
}

export default Main;

```