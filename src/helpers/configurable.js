import React, { Component } from "react";
import {
	propEq,
	lensIndex,
	lensPath,
	omit,
	lensProp,
	view,
	set,
	append,
	flatten,
	reject,
	compose,
	findIndex,
	map,
	update,
	over } from "ramda";
import uuid from "uuid/v1";
import generateJSX from "./generateJSX";

const safeClick = fn => e => {
	e.preventDefault();
	e.stopPropagation();
	return fn && fn(e);
};

const lensMatching = pred => (toF => entities => {
	const index = findIndex(pred, entities);

	return map(entity => update(index, entity, entities), toF(entities[index]));
});

const lensById = compose(lensMatching, propEq("id"));

const DummyComponent = ({ children }) => <div>{children}</div>; // eslint-disable-line

let componentState = [{
	id: 1,
	type: "rootComponent",
	props: {
		background: "red",
		color: "white",
	},
	children: [],
}];

const setState = (newState) => componentState = newState;

const removeFromState = (lens, id) => {
	const byId = (component) => view(lensProp("id"), component) === id;

	const newArray = compose(
		reject(byId),
		view(lens)
	)(componentState);

	const newState = set(lens, newArray, componentState);

	// side effect. How shall we contain this...?
	setState(newState);
};

const addToState = (uniqueID, value, parentLens, props) => {
	// dont need all the stateprops of this configurable component in the componentState, so lets cleanup a bit.
	const newComponent = {
		id: uniqueID,
		type: value.displayName || value.name,
		children: [],
		props: props,
	};
	const newArray = compose(append(newComponent), view(parentLens))(componentState);
	const newState = set(parentLens, newArray, componentState);

	// side effect. How shall we contain this...?
	setState(newState);
};


const updateState = (id, lens, props) => {
	console.log("props", props);
	const propsLens = compose(lens, lensProp("props"));
	const newState = set(propsLens, props, componentState);

	setState(newState);
};

const getCleanProps = (props) => omit(["children", "parentLens", "removeChild", "id", "lens"], props);

const printJSX = () => {
	console.log("componentState", componentState);
	const string = generateJSX(componentState);

	console.log("componentState", string.join(""));
};

const configurable = config => WrappedComponent => {
	return class ConfigurableComponent extends Component { // eslint-disable-line
		state = {
			child: "aa",
			props: {},
			listedProp: undefined,
			textInput: "",
		}

		static defaultProps = {
			id: 1,
			lens: lensById(1),
			// parentLens: ,
		}

		// identify the component for reference in componentState


		componentDidMount() {
			this.setState({ // eslint-disable-line
				props: { ...this.getWrappedComponentProps(), ...this.props },
			});
		}

		getWrappedComponentProps = () => {
			// TODO -> should be possible to add some prop values before rendering the component.
			// because yeah well.. we don't really have a way of accessing the default props of the component, now do we...?
			if (WrappedComponent.propTypes) {
				const keys = Object.keys(WrappedComponent.propTypes);
				const CDummy = configurable(config)(DummyComponent);

				return keys.reduce((acc, key) => {
					return {
						...acc,
						[key]: undefined,
						children: <CDummy removeChild={this.removeChild} id={0}>{"some dummy text"}</CDummy>, // not logging this one to state, because is only dummy to be removed.
					};
				}, {});
			}
		}

		removeChild = (id) => {
			const byPropId = (component) => view(lensPath(["props", "id"]), component) === id;
			const propLens = lensProp("children");

			// find the child in componentState and remove it there as well.
			const { parentLens } = this.props;

			removeFromState(parentLens, id);

			// component update for representation in the DOM.
			const newChildren = reject(byPropId, this.state.props.children);

			if (Array.isArray(this.state.props.children)) {
				this.setState({
					props: set(propLens, newChildren, this.state.props),
				});
			} else {
				this.setState({
					props: set(propLens, "", this.state.props),
				});
			}
		}

		setPropState = (prop, value) => {
			const propLens = lensProp(prop);
			const { parentLens, lens } = this.props;

			const NewComponent = prop === "children" && typeof value === "function" ? configurable(config)(value) : undefined;

			const newChildren = compose(
				flatten,
				append(NewComponent)
			)([this.state.props.children]);

			const cleanedProps = getCleanProps(this.state.props);

			const componentTree = newChildren.filter(c => c).map((Child, i) => {
				if (typeof Child === "object" || typeof Child === "string") {
					return Child;
				}

				// TODO -> refactor this without the lensIndex based on array index. Maybe do something with the uniqueID, because it is messing with
				// the correct indexes, I think.
				// const deeperLens = compose(lensById(this.props.id));
				// const parentChildrenLens = compose(deeperLens, lensProp("children"));

				// console.log("view(parentChildrenLens, componentState)", view(parentChildrenLens, componentState));
				// console.log("componentState", componentState);
				// console.log("view(deeperLens, componentState // entire object", view(deeperLens, componentState));
				// // console.log("view(parentChildrenLens, componentState // only the children", view(parentChildrenLens, componentState));
				// const idLens = lensById(this.props.id);
				// const thisLens = compose(parentLens, lensIndex(i - 1));

				const uniqueID = uuid();
				const childrenLens = compose(lens, lensProp("children"));
				const deeperLens = compose(childrenLens, lensById(uniqueID));

				// add this specific child to componentState
				addToState(uniqueID, value, childrenLens, cleanedProps);
				console.log("componentState", componentState);
				return <Child key={uniqueID} removeChild={this.removeChild} id={uniqueID} lens={deeperLens} />; // eslint-disable-line
			});

			// dom state update
			const propValue = NewComponent ? componentTree : value;
			const newProps = set(propLens, propValue, this.state.props);

			this.setState({
				props: newProps,
			}, () => {
				// update component props in componentState
				const newCleanedProps = getCleanProps(this.state.props);

				// TODO -> the lens is not always correct when we are removing things, apparently.
				updateState(this.props.id, lens, newCleanedProps);
			});
		}

		showPropList = (prop) => {
			this.setState({
				listedProp: prop,
			});
		}

		renderPropList = () => {
			const { components } = config;
			const { listedProp, textInput } = this.state;
			const keys = Object.keys(components);

			const componentList = keys.map(key => {
				return (
					<div
						key={key}
						style={{ padding: 30, border: "4px solid grey" }}
						onClick={safeClick(() => this.setPropState(listedProp, components[key]))}
					>
						{key}
					</div>
				);
			});

			return (
				<div>
					<div>
						<input
							onClick={e => e.stopPropagation()}
							type="text"
							onChange={safeClick((e) => this.setState({ textInput: e.target.value }))}
							value={textInput}
						/>
						<span
							onClick={safeClick(() => this.setPropState(listedProp, textInput))}
						>
							{"SET"}
						</span>
						{listedProp === "children" && componentList}
					</div>
				</div>
			);
		}

		renderPropSwitcher = () => {
			const { listedProp, props } = this.state;

			if (props) {
				const keys = Object.keys(props);

				const propList = keys.map(prop => {
					return (
						<div
							className="fc-flex-container"
							key={prop}
							onClick={safeClick(() => this.showPropList(prop))}
						>
							{prop}
							{listedProp && listedProp === prop && this.renderPropList()}
						</div>
					);
				});

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
						}}
					>
						<div
							onClick={safeClick(() => this.props.removeChild(this.props.id))} // eslint-disable-line
						>
							{"delete"}
						</div>
						{this.props.id}
						<div onClick={safeClick(() => printJSX())}>{"print JSX"}</div>
						{propList}
					</div>
				);
			}
		}


		render() {
			const { children, ...restProps } = this.state.props;

			return (
				<div
					style={{ position: "relative", borderLeft: this.state.propSwitcher && "4px solid orange" }}
					onClick={safeClick(() => this.setState({ propSwitcher: !this.state.propSwitcher }))}
					ref={c => this.componentRef = c} // eslint-disable-line
				>
					<div style={{ position: "relative" }}>{this.state.propSwitcher && this.renderPropSwitcher()}</div>
					<WrappedComponent {...restProps}>
						{children}
					</WrappedComponent>
				</div>
			);
		}
	};
};

export default configurable;
