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
	const childrenLens = compose(lens, lensProp("children"));
	const byId = (component) => view(lensProp("id"), component) === id;

	const newArray = compose(
		reject(byId),
		view(childrenLens)
	)(componentState);

	const newState = set(childrenLens, newArray, componentState);

	// side effect. How shall we contain this...?
	setState(newState);
};

const addToState = (uniqueID, value, lens, props) => {
	// dont need all the stateprops of this configurable component in the componentState, so lets cleanup a bit.
	const newComponent = {
		id: uniqueID,
		type: value.displayName || value.name,
		children: [],
		props: props,
	};
	const newArray = compose(append(newComponent), view(lens))(componentState);
	const newState = set(lens, newArray, componentState);

	// side effect. How shall we contain this...?
	setState(newState);
};

const updateState = (id, lens, props) => {
	const propsLens = compose(lens, lensProp("props"));
	const newState = set(propsLens, props, componentState);

	setState(newState);
};

const getCleanProps = (props) => omit(["children", "removeChild", "id", "lens"], props);

const printJSX = () => {
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
		}

		componentDidMount() {
			// TODO -> the parent props are also passed to the children; we don't want that..

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
			const { lens } = this.props;

			removeFromState(lens, id);

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
			const { lens } = this.props;

			const NewComponent = prop === "children" && typeof value === "function" ? configurable(config)(value) : undefined;

			const newChildren = compose(
				flatten,
				append(NewComponent)
			)([this.state.props.children]);

			const cleanedProps = getCleanProps(this.state.props);

			const componentTree = newChildren.filter(c => c).map(Child => {
				if (typeof Child === "object" || typeof Child === "string") {
					return Child;
				}

				const uniqueID = uuid();
				const childrenLens = compose(lens, lensProp("children"));
				const deeperLens = compose(childrenLens, lensById(uniqueID));

				// add this specific child to componentState
				addToState(uniqueID, value, childrenLens, cleanedProps);

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
				const DisplayComponent = components[key];

				return (
					<div
						key={key}
						style={{ padding: 30, border: "4px solid grey" }}
						onClick={safeClick(() => this.setPropState(listedProp, components[key]))}
					>
						{key}
						<DisplayComponent />
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
