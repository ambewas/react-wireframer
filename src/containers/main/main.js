import React, { Component } from "react";

import Row from "../../components/row";
import Button from "../../components/button";
import configurated from "../../helpers/configurated";
const CButton = configurated(Button);

import { compose, lensIndex, lensProp } from "ramda";

const testProps = {
	"children": [
		{
			"key": null,
			"ref": null,
			"props": {
				"orderID": 0,
				"children": "some dummy text",
			},
			"_owner": null,
			"_store": {},
		},
		{
			"key": "1",
			"ref": null,
			"props": {
				"orderID": 1,
			},
			"_owner": null,
			"_store": {},
		},
		{
			"key": "2",
			"ref": null,
			"props": {
				"orderID": 2,
			},
			"_owner": null,
			"_store": {},
		},
	],
};

class Main extends Component {
	state = {
		Element: () => <div>{"here be dragons"}</div>,
	}

	getProps = (props, Element) => {
		console.log("props", props);
		console.log("Element", Element);
		const stringProps = JSON.stringify(props);

		console.log("stringProps", stringProps);
		this.setState({
			Element: CButton,
			elementProps: testProps,
		});
	}

	render() {
		const { Element } = this.state;

		return (
			<Row>
				<CButton getProps={this.getProps} parentLens={compose(lensIndex(0), lensProp("children"))} />
				<Element {...this.state.elementProps} />
			</Row>
		);
	}
}

export default Main;
