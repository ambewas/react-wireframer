import React, { Component } from "react";
import PropTypes from "prop-types";

class ClassComponent extends Component {
	state = {}
	static propTypes = {
		children: PropTypes.node,
	}
	render() {
		return (
			<div>{"I am a class"}{this.props.children}</div>
		);
	}
}

export default ClassComponent;
