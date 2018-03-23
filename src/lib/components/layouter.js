import React, { Component } from "react";
import configurable from "./configurable";
import HierarchyContext from "./hierarchyContext";
import uuid from "uuid/v1";
import { DragDropContextProvider, DragSource } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { updateById, addById, removeById, getById } from "../helpers/helpers";
import { cardSource, dragCollect } from "../helpers/dragDropContracts";
import { last, dropLast, set, view, lensPath } from "ramda";

const hierarchyToComponents = (children, components, PropTypes) => {
	if (!Array.isArray(children)) {
		return children;
	}
	return children.map((element, i) => {
		if (typeof element === "string") {
			return element;
		}

		// create configurable component so we can start updating props etc.
		const component = components[element.type];
		const Configurable = configurable(component || element.type, PropTypes);

		return (
			<HierarchyContext.Consumer
				key={element.props.hierarchyPath + i} // eslint-disable-line
			>
				{ctx => (
					<Configurable
						{...element.props}
						componentType={element.type}
						ctx={ctx}
					>
						{element.props.children && element.props.children.length > 0 ? hierarchyToComponents(element.props.children, components, PropTypes) : element.type}
					</Configurable>
				)}
			</HierarchyContext.Consumer>
		);
	});
};

const createLayouter = PropTypes => {
	return class Layouter extends Component {
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
						style: {
							background: "grey",
							padding: "20px",
						},
						children: [],
					},
				}],
				propInputs: {},
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
			const newState = addById(pathTo, theComponent, stateWithoutTheComponent);

			this.setStateWithHistory({
				hierarchy: newState,
			});
		}

		updatePropInHierarchy = (prop, path, value) => {
			const stateArray = this.state.hierarchy;

			const newArray = updateById(path, prop, value, stateArray);

			console.log("newArray", newArray);
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
				<div style={{ position: "fixed", bottom: 0, background: "grey", right: 0, left: 0, padding: 20, zIndex: 100000000000, maxHeight: 300, overflow: "scroll" }}>
					{Object.keys(components).map((comp, i) => {
						const ActualComponent = components[comp];
						const Interim = (props) => {
							return props.connectDragSource(
								<div style={{ padding: 20, border: "3px solid red" }}>
									<p>component: {comp}</p>
									<p>--preview--</p>
									<ActualComponent>{"some child"}</ActualComponent>
								</div>
							);
						};

						const Draggable = DragSource("card", cardSource, dragCollect)(Interim);

						return <div key={comp + i}><Draggable componentType={comp} /></div>; // eslint-disable-line
					})}
				</div>
			);
		}

		setPropInHierarchy = (prop, value) => {
			// update the specific prop in the hierarhcy from the context
			// Layouter will re-render, and updates will propagate.
			this.updatePropInHierarchy(prop, this.state.currentHierarchyPath, value);
		}

		showPropList = (prop) => {
			this.setState({
				listedProp: prop,
			});
		}

		handlePropInput = (e, inputPath, inputType) => {
			this.isEnteringValue = true;
			// text-input values update. No need to propagate this in the hierarchy.
			const { propInputs } = this.state;

			const value = inputType === "checkbox" ? e.target.checked : e.target.value;
			const newState = set(lensPath(inputPath.split(".")), value, propInputs);

			this.setState({ propInputs: newState }, () => {
				if (inputType === "checkbox") {
					this.setPropInHierarchy(inputPath, value);
				}
			});
		}

		handlePropInputBlur = (inputPath, inputValue) => {
			this.isEnteringValue = false;
			this.setPropInHierarchy(inputPath, inputValue);
		}
		handleSelectInput = (e, inputPath) => {
			e.stopPropagation();

			const { propInputs } = this.state;
			const value = e.target.value;

			const newState = set(lensPath(inputPath.split(".")), value, propInputs);

			// TODO -- add support for nested values
			this.setState({ propInputs: newState }, () => this.setPropInHierarchy(inputPath, value));
		}

		renderSelectBox = (propTypeDefinition, inputPath) => {
			const { propInputs } = this.state;

			const selectValue = propInputs[inputPath];
			const options = propTypeDefinition.expectedValues;
			const optionsArray = options.map(option => <option key={option} value={option}>{option}</option>);

			return (
				<select name={inputPath} value={selectValue} onChange={(e) => this.handleSelectInput(e, inputPath)}>
					{optionsArray}
				</select>
			);
		}

		renderInputBox = (inputPath, inputType) => {
			const { propInputs } = this.state;

			const inputValue = view(lensPath(inputPath.split(".")), propInputs);

			console.log("inputValue", inputValue);
			return (
				<div>
					<input
						onClick={e => e.stopPropagation()}
						type={inputType}
						onChange={e => this.handlePropInput(e, inputPath, inputType)}
						onBlur={() => this.handlePropInputBlur(inputPath, inputValue)}
						value={inputValue == null ? "" : inputValue} // eslint-disable-line
						// check for null is to avoid going from an uncontrolled to a controlled input
						checked={inputType === "checkbox" ? inputValue == null ? "" : inputValue : false} // eslint-disable-line
						name={inputPath}
					/>
				</div>
			);
		}

		renderShape = (shape, deeperKey) => {
			const shapeKeys = Object.keys(shape);
			const inputs = shapeKeys.map(shapeKey => {
				// build key path to support updates of deeper keys
				const keyPath = deeperKey ? `${deeperKey}.${shapeKey}` : shapeKey;

				if (shape[shapeKey].shapeTypes) {
					return (
						<div key={keyPath} style={{ display: "flex", paddingBottom: 12 }}>
							<div>{shapeKey}</div>
							<div style={{ marginLeft: 20, paddingLeft: 10, borderLeft: "2px solid blue" }}>{this.renderShape(shape[shapeKey].shapeTypes, keyPath)}</div>
						</div>
					);
				}

				return <div key={shapeKey} style={{ display: "flex", paddingBottom: 12  }}>{shapeKey}{this.getInputType(shape[shapeKey], keyPath)}</div>;
			});

			return inputs;
		}

		getInputType = (propTypeDefinition, propTypePath) => {
			if (propTypeDefinition.type === "enum") {
				// TODO -- must also add value for initialising correctly.
				return this.renderSelectBox(propTypeDefinition, propTypePath);
			}

			if (propTypeDefinition.type === "shape") {
				// loop through the shape and print a select box for each one, with a little bit more marginLeft for every prop...
				return this.renderShape(propTypeDefinition.shapeTypes, propTypePath);
			}

			if (propTypeDefinition.type === "number") {
				return this.renderInputBox(propTypePath, "number");
			}

			if (propTypeDefinition.type === "boolean") {
				return this.renderInputBox(propTypePath, "checkbox");
			}

			return this.renderInputBox(propTypePath, "text");
		}


		renderPropList = (propTypeDefinitions) => {
			const { currentHierarchyPath } = this.state;
			const propTypeKeys = Object.keys(propTypeDefinitions);

			return propTypeKeys.map(propTypeKey => {
				const style = propTypeDefinitions[propTypeKey].type === "shape" ? { marginLeft: 20, paddingLeft: 10, borderLeft: "2px solid blue" } : {};

				return (
					<div key={propTypeKey} style={{ display: "flex", paddingBottom: 12  }}>
						{propTypeKey}
						<div style={style}>{this.getInputType(propTypeDefinitions[propTypeKey], `${currentHierarchyPath}.${propTypeKey}`)}</div>
					</div>
				);
			});
		}

		setPropListInSwitcher = (propTypeDefinitions, currentHierarchyPath) => {
			this.setState({ propTypeDefinitions, currentHierarchyPath });
		}

		renderPropSwitcher = () => {
			const { propTypeDefinitions } = this.state;

			if (propTypeDefinitions) {
				const propList = this.renderPropList(propTypeDefinitions);

				return (
					<div
						style={{ position: "fixed",
							zIndex: 99999999,
							textAlign: "left",
							padding: "10px 30px",
							backgroundColor: "white",
							right: 0,
							top: 0,
							width: 500,
							height: "100vh",
							color: "black",
							overflow: "scroll",
							boxShadow: "0px 6px 14px black",
						}}
					>
						{propList}
					</div>
				);
			}
		}

		render() {
			const components = hierarchyToComponents(this.state.hierarchy, this.props.components, PropTypes);

			const contextObject = {
				updatePropInHierarchy: this.updatePropInHierarchy,
				addToHierarchy: this.addToHierarchy,
				removeFromHierarchy: this.removeFromHierarchy,
				moveInHierarchy: this.moveInHierarchy,
				setPropListInSwitcher: this.setPropListInSwitcher,
				activeComponentHierarchyPath:  this.state.currentHierarchyPath,
			};

			console.log("render");
			return (
				<DragDropContextProvider backend={HTML5Backend}>
					<HierarchyContext.Provider value={contextObject}>
						{this.renderPropSwitcher()}
						{this.getComponentList()}
						{ Array.isArray(components) ? components.map(Comp => Comp) : components}
					</HierarchyContext.Provider>
				</DragDropContextProvider>
			);
		}
	};
};



export default createLayouter;
