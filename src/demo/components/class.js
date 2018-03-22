import React, { Component } from "react";
import PropTypes from "prop-types";

class ClassComponent extends Component {
	state = {}
	static propTypes = {
		children: PropTypes.node,
		someProp: PropTypes.string,
	}

	static defaultProps = {
		someProp: "hehehe",
	}

	render() {
		return (
			<div className={this.props.someProp} style={{background: 'green', height: '50px', width: '100px'}}>{this.props.children}</div> // eslint-disable-line
		);
	}
}

export default ClassComponent;
