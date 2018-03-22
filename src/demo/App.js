import React, { Component } from "react";
import PropTypes from "prop-types";

import Row from "./components/row";
import Button from "./components/button";
import SidebarLayout from "./components/sidebarLayout";
import ClassComponent from "./components/class";

import createLayouter from "../lib/components/layouter";
import "./style.css";
import configurable from "../lib/components/configurable";

const Layouter = createLayouter(PropTypes);

const ConfigRow = configurable(Row, PropTypes);

// TODO -- updating configRows does not work yet, and in fact we won't really need them. The problem here is that these are not "children", and thus they are not being added
// to the hierarchy tree when introduced.
// SO -- we must find a way to support "node" props as well. Not sure how, and frankly.. this might not be a priority right now.
const UsableSidebarLayout = (props) => (
	<SidebarLayout
    left={<ConfigRow componentType="ConfigRow" hierarchyPath={props.hierarchyPath + 'sidebar'} ctx={props.ctx}>child</ConfigRow>} // eslint-disable-line
		right={<ConfigRow componentType="ConfigRow" hierarchyPath={`${props.hierarchyPath  }content`} ctx={props.ctx}>two</ConfigRow>}
		{...props}
	/>
);

class Main extends Component { // eslint-disable-line
	render() {
		return (
			<Layouter components={{ Button, Row, ClassComponent, UsableSidebarLayout }}/>
		);
	}
}

export default Main;
