import React, { Component } from "react";
import configurable from "./configurable";
import HierarchyContext from "./hierarchyContext";
import uuid from "uuid/v1";
import { DragDropContextProvider, DragSource } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { updateById, addById, removeById, getById } from "../helpers/helpers";
import { cardSource, dragCollect } from "../helpers/dragDropContracts";
import { last, dropLast } from "ramda";
import PropSwitcher from "./propSwitcher";
import generateJSX from "../helpers/generateJSX";

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
						children: [{
							id: "button",
							type: "Button",
							props: {
								hierarchyPath: "button",
								children: [],
							},
						}],
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
			if (e.keyCode === 91 || e.keyCode === 93) {
				// cmd is held down
				this.cmdDown = true;
			}

			// undo action. Basically render again with the last item in the history
			if (this.cmdDown && e.keyCode === 90) {
				this.history = dropLast(1, this.history);
				this.setState({
					hierarchy: last(this.history),
				});
			}

			// remove component action
			if (this.cmdDown && e.keyCode === 8) {
				this.removeFromHierarchy(this.state.currentHierarchyPath);
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
			const { hierarchy } = this.state;
			const newArray = updateById(path, prop, value, hierarchy);

			this.setStateWithHistory({
				hierarchy: newArray,
			});
		}

		removeFromHierarchy = (path) => {
			const { hierarchy } = this.state;
			const newArray = removeById(path, hierarchy);

			this.setStateWithHistory({
				hierarchy: newArray,
				// component has been removed. Set current path to undefined
				currentHierarchyPath: undefined,
			});
		}

		handleJSONprintButton = (e) => {
			if (e) {
				e.preventDefault();
			}
			const JSONData = JSON.stringify(this.state.hierarchy);

			console.log(JSONData);
			return JSONData;
		}

		handleJSXprintButton = (e) => {
			e.preventDefault();
			const JSONData = this.state.hierarchy;
			const JSX = generateJSX(JSONData)[0];

			console.log(JSX);
		}

		getJSONbutton = () => {
			return (
				<div>
					<button onClick={this.handleJSONprintButton}>get the JSON</button>
					<button onClick={this.handleJSXprintButton}>get the JSX</button>
				</div>
			);
		}

		getComponentList = () => {
			const { components } = this.props;

			return (
				<div style={{ position: "fixed", bottom: 0, background: "grey", right: 0, left: 0, padding: 20, zIndex: 100000000000, maxHeight: 300, overflow: "scroll" }}>
					{this.getJSONbutton()}
					{Object.keys(components).map((comp, i) => {
						const ActualComponent = components[comp];
						const Interim = (props) => {
							return props.connectDragSource(
								<div style={{ padding: 20, border: "3px solid red" }}>
									<p>component: {comp}</p>
									<ActualComponent>{comp}</ActualComponent>
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

		showPropList = (listedProp) => {
			this.setState({ listedProp });
		}


		setPropListInSwitcher = (propTypeDefinitions, currentHierarchyPath) => {
			this.setState({ propTypeDefinitions, currentHierarchyPath });
		}

		render() {
			const { currentHierarchyPath, hierarchy, propTypeDefinitions, propInputs } = this.state;
			const components = hierarchyToComponents(hierarchy, this.props.components, PropTypes);

			const contextObject = {
				updatePropInHierarchy: this.updatePropInHierarchy,
				addToHierarchy: this.addToHierarchy,
				removeFromHierarchy: this.removeFromHierarchy,
				moveInHierarchy: this.moveInHierarchy,
				setPropListInSwitcher: this.setPropListInSwitcher,
				activeComponentHierarchyPath:  currentHierarchyPath,
			};

			return (
				<DragDropContextProvider backend={HTML5Backend}>
					<HierarchyContext.Provider value={contextObject}>
						{currentHierarchyPath && (
							<PropSwitcher
								hierarchy={this.state.hierarchy}
								propInputs={propInputs}
								hierarchyPath={currentHierarchyPath}
								updatePropInHierarchy={this.updatePropInHierarchy}
								propTypeDefinitions={propTypeDefinitions}
								onCloseClick={() => this.setState({ currentHierarchyPath: undefined })}
							/>
						)}
						{"version 2"}
						{this.getComponentList()}
						{ Array.isArray(components) ? components.map(Comp => Comp) : components}
					</HierarchyContext.Provider>
				</DragDropContextProvider>
			);
		}
	};
};



export default createLayouter;
