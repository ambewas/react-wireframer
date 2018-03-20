/**
 * TODO
 *
 * implement undo/redo
 */


import React, { Component } from "react";
import configurable from "../helpers/configurable";
import PropTypes from "prop-types";
import HierarchyContext from "./hierarchyContext";
import uuid from "uuid/v1";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { DragSource } from "react-dnd";
import R from "ramda";
import { updateById, addById, removeById } from "./helpers";

const hierarchyToComponents = (children, components) => {
	if (!Array.isArray(children)) {
		return children;
	}
	return children.map((element, i) => {
		if (typeof element === "string") {
			return element;
		}

		// create configurable component so we can start updating props etc.
		const component = components[element.type];
		const Configurable = configurable(component || element.type);

		return (
			<HierarchyContext.Consumer key={i}>
				{ctx => (
					<Configurable {...element.props} ctx={ctx}>{element.props.children && element.props.children.length > 0 ? hierarchyToComponents(element.props.children, components) : ""}</Configurable>
				)}
			</HierarchyContext.Consumer>
		);
	});

};

/**
 * Specifies the props to inject into your component.
 */
function collect(connect, monitor) {
	return {
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging(),
	};
}

/**
 * Implements the drag source contract.
 */
const cardSource = {
	beginDrag(props) {
		return {
			componentType: props.componentType,
		};
	},
};

class Layouter extends Component {
	static propTypes = {
		components: PropTypes.object,
	}
	constructor(props) {
		super(props);
		this.state = {
			hierarchy: [{
				id: "root",
				type: "div",
				props: {
					hierarchyPath: "root",
					children: [
						{
							id: "row",
							type: "Row",
							props: {
								hierarchyPath: "row",
								children: [
									{
										id: "button",
										type: "Button",
										props: {
											hierarchyPath: "button",
											background: "red",
											children: "button",
											light: true,
										},
									},
								],
							},
						},
					],
				},
			}],
		};
	}

	addToHierarchy = (comp, path) => {
		const { hierarchy } = this.state;

		const id = uuid();
		const compObject = {
			id: id,
			type: comp,
			// no need to complete props, we'll render all components with default props. This IS the object that will be edited with prop updates from <configurable>, though.
			props: {
				hierarchyPath: id,
				children: comp,
			},
		};

		const newArray = addById(path, compObject, hierarchy);

		this.setState({
			hierarchy: newArray,
		});
	}

	updatePropInHierarchy = (prop, path, value) => {
		const stateArray = this.state.hierarchy;
		const newArray = updateById(path, prop, value, stateArray);

		this.setState({
			hierarchy: newArray,
		});
	}

	removeFromHierarchy = (path) => {
		const stateArray = this.state.hierarchy;

		const newArray = removeById(path, stateArray);

		this.setState({
			hierarchy: newArray,
		});
	}

	getComponentList = () => {
		const { components } = this.props;

		return (
			<div style={{ position: "fixed", bottom: 0, background: "grey", right: 0, left: 0, padding: 20 }}>
				{Object.keys(components).map((comp, i) => {
					const ActualComponent = components[comp];
					const Interim = (props) => {
						return props.connectDragSource(<div><ActualComponent /></div>);
					};

					const Draggable = DragSource("card", cardSource, collect)(Interim);

					return <div key={comp + i}><Draggable componentType={comp} /></div>; // eslint-disable-line
				})}
			</div>
		);
	}

	render() {
		const components = hierarchyToComponents(this.state.hierarchy[0].props.children, this.props.components);

		console.log("components", components);
		const contextObject = {
			updatePropInHierarchy: this.updatePropInHierarchy,
			addToHierarchy: this.addToHierarchy,
			removeFromHierarchy: this.removeFromHierarchy,
		};

		console.log("this.state.hierarchy", this.state.hierarchy);
		return (
			<DragDropContextProvider backend={HTML5Backend}>
				<HierarchyContext.Provider value={contextObject}>
					{ this.getComponentList() }
					{ Array.isArray(components) ? components.map(Comp => Comp) : components}
				</HierarchyContext.Provider>
			</DragDropContextProvider>
		);
	}
}



export default Layouter;
