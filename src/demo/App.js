import React, { Component } from "react";
import PropTypes from "prop-types";

import Row from "./components/row";
import Button from "./components/button";
import ClassComponent from "./components/class";
import Label from "./components/label";

import createLayouter from "../lib/components/layouter";
import "./style.css";
import "../lib/style.css";

const Layouter = createLayouter(PropTypes);

class Main extends Component { // eslint-disable-line
	constructor() {
		super();
		this.state = {
			hierarchy: [{ "id":"firstbutton", "type":"Button", "props":{ "hierarchyPath":"firstbutton", "children":"Button" } }, { "id":"row", "type":"Row", "props":{ "hierarchyPath":"row", "children":[{ "id":"secondbutton", "type":"Button", "props":{ "hierarchyPath":"secondbutton", "children":"Button", "myShape":{ "background":"green" } } }, { "id":"c04110c0-3414-11e8-a6ae-65bfe30c5376", "type":"Button", "props":{ "hierarchyPath":"c04110c0-3414-11e8-a6ae-65bfe30c5376", "children":[] } }, { "id":"c0bde1e0-3414-11e8-a6ae-65bfe30c5376", "type":"Button", "props":{ "hierarchyPath":"c0bde1e0-3414-11e8-a6ae-65bfe30c5376", "children":"Button" } }, { "id":"bf496a50-3414-11e8-a6ae-65bfe30c5376", "type":"Button", "props":{ "hierarchyPath":"bf496a50-3414-11e8-a6ae-65bfe30c5376", "children":"Button" } }, { "id":"bfc09620-3414-11e8-a6ae-65bfe30c5376", "type":"Button", "props":{ "hierarchyPath":"bfc09620-3414-11e8-a6ae-65bfe30c5376", "children":"Button" } }] } }, { "id":"be6dfe70-3414-11e8-a6ae-65bfe30c5376", "type":"Button", "props":{ "hierarchyPath":"be6dfe70-3414-11e8-a6ae-65bfe30c5376", "children":"Button" } }, { "id":"bee97000-3414-11e8-a6ae-65bfe30c5376", "type":"Button", "props":{ "hierarchyPath":"bee97000-3414-11e8-a6ae-65bfe30c5376", "children":"Button" } }],
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
				components={{ Button, Row, ClassComponent, Label }}
			/>
		);
	}
}

export default Main;
