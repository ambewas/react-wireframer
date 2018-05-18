# react wireframer

build wireframes with your react components!

`npm i react-wireframer`

To use this layouter, make sure your components have propTypes defined. All defined proptypes will be exposed when clicking on the component in the app.

Try dragging & dropping.

Try cmd + z for undo.

example usage:
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