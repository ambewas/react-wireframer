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
				props: {  ...this.props },
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
			if (e.keyCode === 8 && !this.isEnteringValue) {
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

		handlePropInput = (e, inputPath, inputType) => {
			this.isEnteringValue = true;
			// text-input values update. No need to propagate this in the hierarchy.
			const { propInputs } = this.state;

			const value = inputType === "checkbox" ? e.target.checked : e.target.value;
			const newState = set(lensProp(inputPath), value, propInputs);

			this.setState({ propInputs: newState }, () => {
				if (inputType === "checkbox") {
					this.setPropInHierarhcy(inputPath, value);
				}
			});
		}

		handlePropInputBlur = () => {
			this.isEnteringValue = false;
		}
		handleSelectInput = (e, inputPath) => {
			e.stopPropagation();

			const { propInputs } = this.state;
			const newState = set(lensProp(inputPath), e.target.value, propInputs);

			// TODO -- add support for nested values
			this.setState({ propInputs: newState }, () => this.setPropInHierarhcy(inputPath, newState[inputPath]));
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
			const inputValue = propInputs[inputPath];

			return (
				<div>
					<input
						onClick={e => e.stopPropagation()}
						type={inputType}
						onChange={e => this.handlePropInput(e, inputPath, inputType)}
						onBlur={this.handlePropInputBlur}
						value={inputValue}
						checked={inputType === "checkbox" ? inputValue : undefined}
					/>
					<span
						onClick={safeClick(() => this.setPropInHierarhcy(inputPath, inputValue))}
					>
						{`SET ${  inputPath}`}
					</span>
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
						<div key={keyPath}>
							<div style={{ borderBottom: "2px solid blue" }}>{shapeKey}</div>
							<div style={{ marginLeft: 20 }}>{this.renderShape(shape[shapeKey].shapeTypes, keyPath)}</div>
						</div>
					);
				}

				return <div key={shapeKey}>{shapeKey}{this.getInputType(shape[shapeKey], keyPath)}</div>;
			});

			return inputs;
		}

		getInputType = (propTypeDefinition, propTypeKey) => {
			if (propTypeDefinition.type === "enum") {
				// TODO -- must also add value for initialising correctly.
				return this.renderSelectBox(propTypeDefinition, propTypeKey);
			}

			if (propTypeDefinition.type === "shape") {
				// loop through the shape and print a select box for each one, with a little bit more marginLeft for every prop...
				return this.renderShape(propTypeDefinition.shapeTypes, propTypeKey);
			}

			if (propTypeDefinition.type === "number") {
				return this.renderInputBox(propTypeKey, "number");
			}

			if (propTypeDefinition.type === "boolean") {
				return this.renderInputBox(propTypeKey, "checkbox");
			}

			return this.renderInputBox(propTypeKey, "text");
		}


		renderPropList = (propTypeDefinitions) => {
			const propTypeKeys = Object.keys(propTypeDefinitions);

			return propTypeKeys.map(propTypeKey => {
				return <div key={propTypeKey}>{propTypeKey}{this.getInputType(propTypeDefinitions[propTypeKey], propTypeKey)}</div>;
			});
		}

		renderPropSwitcher = () => {
			const { props } = this.state;
			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);
			// render a list of all props that can be edited. We'll omit any props added by react dnd etc.

			if (props) {
				// const cleanProps = getCleanProps(props);

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
						onClick={e => e.stopPropagation()}
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

			const cleanProps = getCleanProps(restProps);

			return (
				<div
					style={{ position: "relative", borderLeft: this.state.propSwitcher && "4px solid orange" }}
				>
					<div style={{ position: "relative" }}>{this.state.propSwitcher && this.renderPropSwitcher()}</div>
					{
						connectDropTarget(
							connectDragSource(
								<div style={style} onClick={((e) => this.handleComponentClick(e))}>
									<WrappedComponent {...cleanProps}>
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

