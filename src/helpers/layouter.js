/**
 * TODO
 *
 * implement undo/redo
 * still a couple of bugs with moving components inside itself, and moving components inside one of its children. This must be prevented
 */


import React, { Component } from "react";
import configurable from "../helpers/configurable";
import PropTypes from "prop-types";
import HierarchyContext from "./hierarchyContext";
import uuid from "uuid/v1";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { DragSource } from "react-dnd";
import { updateById, addById, removeById, getById } from "./helpers";
import { cardSource, dragCollect } from "./dragDropContracts";
import { last, dropLast } from "ramda";

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

		const compClass = component.prototype.render && new component({});
		const compClassPropTypes = compClass && compClass.render().type.propTypes;


		return (
			<HierarchyContext.Consumer
				key={element.props.hierarchyPath + i} // eslint-disable-line
			>
				{ctx => (
					<Configurable
						{...element.props}
						componentType={element.type}
						ctx={ctx}
						deepPropTypes={compClassPropTypes}
					>
						{element.props.children && element.props.children.length > 0 ? hierarchyToComponents(element.props.children, components) : element.type}
					</Configurable>
				)}
			</HierarchyContext.Consumer>
		);
	});
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
									{
										id: "button2",
										type: "Button",
										props: {
											hierarchyPath: "button2",
											background: "red",
											children: "button 2 drag",
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

		this.history = [this.state.hierarchy];
	}

	componentDidMount() {
		window.addEventListener("keydown", this.handleKeyDown);
		window.addEventListener("keyup", this.handleKeyUp);
	}

	componentWillUnMount() {
		window.removeEventListener("keydown", this.handleKeyDown);
		window.removeEventListener("keyup", this.handleKeyUp);
	}

	handleKeyUp = (e) => {
		if (e.keyCode === 91) {
			// cmd is no longer down
			this.cmdDown = false;
		}
	}

	handleKeyDown = (e) => {
		if (e.keyCode === 91) {
			// cmd is held down
			this.cmdDown = true;
		}

		if (this.cmdDown && e.keyCode === 90) {
			this.history = dropLast(1, this.history);
			this.setState({
				hierarchy: last(this.history),
			});
		}
	}

	addToHierarchy = (componentProps, path) => {
		const { hierarchy } = this.state;

		const id = uuid();

		const compObject = {
			id: id,
			type: componentProps.componentType,
			// no need to complete props, we'll render all components with default props. This IS the object that will be edited with prop updates from <configurable>, though.
			props: {
				hierarchyPath: id,
				children: componentProps.componentType,
			},
		};

		const newArray = addById(path, compObject, hierarchy);

		this.setStateWithHistory({
			hierarchy: newArray,
		});
	}

	setStateWithHistory = (object) => {
		this.setState(object, () => {
			this.history.push(object.hierarchy);
		});
	}

	moveInHierarchy = (pathFrom, pathTo) => {
		const { hierarchy } = this.state;
		// get the piece of the component tree based on pathFrom

		const theComponent = getById(pathFrom, hierarchy);

		// don't move a component into it's own children
		const theDropTarget = getById(pathTo, [theComponent]);

		if (theDropTarget) {
			console.warn("you cannot move a component inside children of itself!"); // eslint-disable-line
			return;
		}

		// delete the component in the pathFrom
		const stateWithoutTheComponent = removeById(pathFrom, hierarchy);

		// add the component in the pathTo
		console.log("theComponent", theComponent);
		const newState = addById(pathTo, theComponent, stateWithoutTheComponent);

		this.setStateWithHistory({
			hierarchy: newState,
		});
	}

	updatePropInHierarchy = (prop, path, value) => {
		const stateArray = this.state.hierarchy;
		const newArray = updateById(path, prop, value, stateArray);

		this.setStateWithHistory({
			hierarchy: newArray,
		});
	}

	removeFromHierarchy = (path) => {
		const stateArray = this.state.hierarchy;

		const newArray = removeById(path, stateArray);

		this.setStateWithHistory({
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
						return props.connectDragSource(<div><ActualComponent>somechild</ActualComponent></div>);
					};

					const Draggable = DragSource("card", cardSource, dragCollect)(Interim);

					return <div key={comp + i}><Draggable componentType={comp} /></div>; // eslint-disable-line
				})}
			</div>
		);
	}

	render() {
		console.log("this.history", this.history);
		const components = hierarchyToComponents(this.state.hierarchy[0].props.children, this.props.components);

		const contextObject = {
			updatePropInHierarchy: this.updatePropInHierarchy,
			addToHierarchy: this.addToHierarchy,
			removeFromHierarchy: this.removeFromHierarchy,
			moveInHierarchy: this.moveInHierarchy,
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
