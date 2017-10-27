import React, { Component } from "react";
import { propEq, lensIndex, lensPath, lensProp, view, set, append, flatten, reject, compose, over } from "ramda";
import uuid from "uuid/v1";

const safeClick = fn => e => {
	e.preventDefault();
	e.stopPropagation();
	return fn && fn(e);
};

const DummyComponent = ({ children }) => <div>{children}</div>; // eslint-disable-line

let componentState = [{
	_id: 1,
	_type: "root",
	children: [],
}];


const configurable = config => WrappedComponent => {
	return class ConfigurableComponent extends Component { // eslint-disable-line
		state = {
			child: "aa",
			props: {},
			listedProp: undefined,
		}

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
			const byId = (component) => view(lensProp("id"), component) === id;
			const newChildren = reject(byPropId, this.state.props.children);
			const propLens = lensProp("children");

			// find the child in componentState and remove it there as well.
			const parentLens = this.props.parentLens;
			const arrayToRemoveFrom = view(parentLens, componentState);
			const newArray = reject(byId, arrayToRemoveFrom);
			const newState = set(parentLens, newArray, componentState);

			componentState = newState;

			// component update for representation in the DOM.
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

			const NewComponent = prop === "children" && typeof value === "function" ? configurable(config)(value) : undefined;

			const newChildren = compose(
				flatten,
				append(NewComponent)
			)([this.state.props.children]);

			const componentTree = newChildren.filter(c => c).map((Child, i) => {
				if (typeof Child === "object" || typeof Child === "string") {
					return Child;
				}

				const uniqueID = uuid();
				const newComponent = {
					id: uniqueID,
					_type: value.name,
					children: [],
					// TODO -> this is one tick too soon. These props are the parent props, and not those of the child to be added.
					props: this.state.props,
				};

				const parentLens = this.props.parentLens;
				const deeperLens = compose(parentLens, lensIndex(i - 1), lensProp("children"));
				const arrayToAddTo = view(parentLens, componentState);

				arrayToAddTo.push(newComponent);

				const newState = set(parentLens, arrayToAddTo, componentState);

				componentState = newState;

				return <Child key={uniqueID} removeChild={this.removeChild} id={uniqueID} hey={"hello"} parentLens={deeperLens} />; // eslint-disable-line
			});

			const propValue = NewComponent ? componentTree : value;

			this.setState({
				props: set(propLens, propValue, this.state.props),
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
						{propList}
					</div>
				);
			}
		}

		render() {
			const { children, ...restProps } = this.state.props;

			console.log("componentState", componentState);
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
