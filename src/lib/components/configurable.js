/**
 * todo
 *
 * shape inputs?? !
 * set arrays as values on array props
 * remove on backspace
 */

import React, { Component } from "react";

import {
	set,
	omit,
	propEq,
	compose,
	keys,
	filter,
	lensProp,
} from "ramda";

import {
	safeClick,
	getPropTypeShape,
	getCleanProps,
} from "../helpers/helpers";

import { DropTarget, DragSource } from "react-dnd";
import { dropSource, dropCollect, treeSource, dragCollect } from "../helpers/dragDropContracts";


const configurable = (WrappedComponent, PropTypes) => {
	// TODO -- rerenders from top level reset the state of lower components; e.g. when the editor is open, it closes again.
	// how to protect against this? PureComponents..?

	class ConfigurableComponent extends Component {
		static propTypes = {
			children: PropTypes.any,
			hierarchyPath: PropTypes.string,
			isOverCurrent: PropTypes.bool,
			connectDropTarget: PropTypes.func,
			connectDragSource: PropTypes.func,
			ctx: PropTypes.object,
		};
		constructor(props) {
			super(props);

			const wrappedComponentProps = this.getWrappedComponentProps();

			this.state = {
				props: { ...wrappedComponentProps, ...this.props },
				listedProp: undefined,
				propInputs: { ...wrappedComponentProps, ...this.props },
			};
		}

		componentWillUnmount() {
			// remove any event listeners if there were any added
			window.removeEventListener("keyup", this.handleKeyUp);
		}

		componentDidUpdate() {
			if (this.state.propSwitcher) {
				window.addEventListener("keyup", this.handleKeyUp);
			}
		}

		handleKeyUp = (e) => {
			// remove specific element from hierarchy if we're not currently filling out anything
			if (e.keyCode === 8 && !this.state.listedProp) {
				this.props.ctx.removeFromHierarchy(this.props.hierarchyPath);
			}
		}

		getWrappedComponentProps = () => {
			const extraPropTypes = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

			const extraProps = Object.keys(extraPropTypes).reduce((acc, key) => {
				const keyValue = extraPropTypes[key] && extraPropTypes[key].type === "shape" ? getPropTypeShape(extraPropTypes[key].shapeTypes) : undefined;

				return {
					...acc,
					[key]: keyValue,
				};
			}, {});
			let props;

			if (WrappedComponent.propTypes) {
				// filter out all function props; We can't do anything with them anyway.
				const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

				console.log("propTypeDefinitions", propTypeDefinitions);
				const cleanedKeys = omit(
					compose(
						keys,
						filter(propEq("type", "functions")),
					)(propTypeDefinitions),
					propTypeDefinitions,
				);

				// build a props object based on these keys and shapeTypes.
				// TODO can't init these with empty string due to propTypes (controlled/uncontrolled warning is still here). Perhaps provide a sensible default ourselves...?
				props = Object.keys(cleanedKeys).reduce((acc, key) => {
					const keyValue = propTypeDefinitions[key] && propTypeDefinitions[key].type === "shape" ? getPropTypeShape(propTypeDefinitions[key].shapeTypes) : undefined;

					return {
						...acc,
						[key]: keyValue,
						children: this.props.children,
					};
				}, {});

			}
			return { ...props, ...extraProps };
		}

		setPropInHierarhcy = (prop, value) => {
			const { ctx } = this.props;
			// update the specific prop in the hierarhcy from the context
			// Layouter will re-render, and updates will propagate.

			ctx.updatePropInHierarchy(prop, this.props.hierarchyPath, value);
		}

		showPropList = (prop) => {
			this.setState({
				listedProp: prop,
			});
		}

		handlePropInput = (e) => {
			// text-input values update. No need to propagate this in the hierarchy.
			const { listedProp, propInputs } = this.state;
			const newState = set(lensProp(listedProp), e.target.value, propInputs);

			this.setState({ propInputs: newState });
		}


		handleSelectInput = (e) => {
			// text-input values update. No need to propagate this in the hierarchy.
			const { listedProp, propInputs } = this.state;
			const newState = set(lensProp(listedProp), e.target.value, propInputs);

			// TODO -- add support for nested values
			this.setState({ propInputs: newState }, () => this.setPropInHierarhcy(listedProp, newState[listedProp]));
		}

		renderSelectBox = (propType) => {
			const { listedProp, inputValue } = this.state;
			const options = propType.expectedValues;
			const optionsArray = options.map(option => <option key={option} value={option}>{option}</option>);

			return (
				<select name={listedProp} value={inputValue} onChange={(e) => this.handleSelectInput(e)}>
					{optionsArray}
				</select>
			);
		}

		renderInputBox = (inputValue) => {
			const { listedProp } = this.state;

			return (
				<div>
					<input
						onClick={e => e.stopPropagation()}
						type="text"
						onChange={this.handlePropInput}
						value={inputValue}
					/>
					<span
						onClick={safeClick(() => this.setPropInHierarhcy(listedProp, inputValue))}
					>
						{"SET"}
					</span>
				</div>
			);
		}
		renderShape = (shape) => {
			const getShapeSelectOrInput = (deepShape) => {
				if (shape.expectedValues) {
					return this.renderSelectBox(deepShape.type);
				}

			};

		}

		getInputType = (propTypeDefinition, inputValue) => {
			if (propTypeDefinition && propTypeDefinition.type === "enum") {
				return this.renderSelectBox(propTypeDefinition);
			}

			return this.renderInputBox(inputValue);

		}

		renderPropInput = () => {
			const { listedProp, propInputs } = this.state;

			// TODO -- add support for nested values
			const inputValue = propInputs[listedProp];

			// TODO -- show different inputs for different props. For example, we want a drop down menu for oneOf proptypes
			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

			if (propTypeDefinitions[listedProp] && propTypeDefinitions[listedProp].type === "shape") {
				// loop through the shape and print a select box for each one, with a little bit more marginLeft for every prop...
				console.log("propTypeDefinitions[listedProp]", propTypeDefinitions[listedProp]);
				return this.renderShape(propTypeDefinitions[listedProp].shapeTypes);
			}

			return this.getInputType(propTypeDefinitions[listedProp], inputValue);

		}

		renderPropSwitcher = () => {
			const { listedProp, props } = this.state;
			const { ctx } = this.props;
			// render a list of all props that can be edited. We'll omit any props added by react dnd etc.

			if (props) {
				const cleanProps = getCleanProps(props);
				const propKeys = Object.keys(cleanProps);
				const propList = propKeys.map(prop => {
					return (
						<div
							key={prop}
							onClick={safeClick(() => this.showPropList(prop))}
						>
							{prop}
							{listedProp && listedProp === prop && this.renderPropInput()}
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
							boxShadow: "0px 6px 14px black",
						}}
					>
						{propList}
					</div>
				);
			}
		}

		handleComponentClick = (e) => {
			e.stopPropagation();
			this.setState({ propSwitcher: !this.state.propSwitcher });
		}

		render() {
			const { children, ...restProps } = this.state.props;
			const { isOverCurrent, connectDropTarget, ctx, connectDragSource } = this.props;

			const style = isOverCurrent ? { borderLeft: "4px solid green" } : {};

			return (
				<div
					style={{ position: "relative", borderLeft: this.state.propSwitcher && "4px solid orange" }}
					onClick={((e) => this.handleComponentClick(e, ctx))}
				>
					<div style={{ position: "relative" }}>{this.state.propSwitcher && this.renderPropSwitcher()}</div>
					{
						connectDropTarget(
							connectDragSource(
								<div style={style}>
									<WrappedComponent {...restProps}>
										{children || this.props.children}
									</WrappedComponent>
								</div>
							)
						)}
				</div>
			);
		}
	}
	return compose(
		DragSource("card", treeSource, dragCollect),
		DropTarget("card", dropSource, dropCollect)
	)(ConfigurableComponent);
};

export default configurable;

