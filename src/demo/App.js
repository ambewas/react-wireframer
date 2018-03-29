import React, { Component } from "react";
import PropTypes from "prop-types";

import Row from "./components/row";
import Button from "./components/button";
import ClassComponent from "./components/class";

import createLayouter from "../lib/components/layouter";
import "./style.css";
import "../lib/style.css";

const Layouter = createLayouter(PropTypes);

class Main extends Component { // eslint-disable-line
	constructor() {
		super();
		this.state = {
			hierarchy: [{ "id":"ab6287f0-3294-11e8-a95f-6f6fb5be77f8", "type":"Button", "props":{ "hierarchyPath":"ab6287f0-3294-11e8-a95f-6f6fb5be77f8", "children":"Button" } }, { "id":"acbf0ab0-3294-11e8-a95f-6f6fb5be77f8", "type":"Row", "props":{ "hierarchyPath":"acbf0ab0-3294-11e8-a95f-6f6fb5be77f8", "children":[{ "id":"aeb20110-3294-11e8-a95f-6f6fb5be77f8", "type":"Button", "props":{ "hierarchyPath":"aeb20110-3294-11e8-a95f-6f6fb5be77f8", "children":"Button", "myShape":{ "background":"green" } } }] } }],
		};
	}
	render() {
		return (
			<Layouter
				hierarchy={this.state.hierarchy}
				onChange={hierarchy => {
					console.log("hierarchy on top", hierarchy);
					this.setState({ hierarchy });
				}}
				components={{ Button, Row, ClassComponent }}
			/>
		);
	}
}

export default Main;
