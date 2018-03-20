/**
 * todo
 *
 * shape inputs?? !
 * set arrays as values on array props
 * remove on backspace
 */

import React, { Component } from "react";
import PropTypes from "prop-types";

import R, {
	lensProp,
	set,
	omit,
	propEq,
	prop as propView,
} from "ramda";

import {
	safeClick,
	getPropTypeShape,
	getCleanProps,
} from "./helpers";

import { DropTarget } from "react-dnd";



const dropSource = {
	drop(props, monitor) {
		const hasDroppedOnChild = monitor.didDrop();
		// prevent deep updates

		if (hasDroppedOnChild) {
			return;
		}

		// add component to hierarchy
		const draggedComponent = monitor.getItem();

		props.ctx.addToHierarchy(draggedComponent.componentType, props.hierarchyPath);
	},
	canDrop(props, monitor) {
		return true;
	},
};


function dropCollect(connect, monitor) {
	return {
		connectDropTarget: connect.dropTarget(),
		isOverCurrent: monitor.isOver({ shallow: true }),
	};
}

const configurable = WrappedComponent => {
	class ConfigurableComponent extends Component {
		static propTypes = {
			children: PropTypes.any,
			hierarchyPath: PropTypes.string,
			isOverCurrent: PropTypes.bool,
			connectDropTarget: PropTypes.func,
			ctx: PropTypes.object,
		}

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
			if (WrappedComponent.propTypes) {
				// filter out all function props; We can't do anything with them anyway.
				const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

				const cleanedKeys = omit(
					R.compose(
						R.keys,
						R.filter(propEq("type", "function")),
					)(propTypeDefinitions),
					propTypeDefinitions,
				);

				// build a props object based on these keys and shapeTypes.
				// TODO can't init these with empty string due to propTypes (controlled/uncontrolled warning is still here). Perhaps provide a sensible default ourselves...?
				const props = Object.keys(cleanedKeys).reduce((acc, key) => {
					const keyValue = propTypeDefinitions[key].type === "shape" ? getPropTypeShape(propTypeDefinitions[key].shapeTypes) : undefined;

					return {
						...acc,
						[key]: keyValue,
						children: this.props.children,
					};
				}, {});

				return props;
			}
		}

		setPropInHierarhcy = (ctx, prop, value) => {
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
			const newState = set(R.lensProp(listedProp), e.target.value, propInputs);

			console.log("e.target.value", e.target.value);
			this.setState({ propInputs: newState });
		}


		handleSelectInput = (e, ctx) => {
			// text-input values update. No need to propagate this in the hierarchy.
			const { listedProp, propInputs } = this.state;
			const newState = set(R.lensProp(listedProp), e.target.value, propInputs);

			// TODO -- add support for nested values
			this.setState({ propInputs: newState }, () => this.setPropInHierarhcy(ctx, listedProp, newState[listedProp]));
		}

		renderPropInput = (ctx) => {
			const { listedProp, propInputs } = this.state;
			// TODO -- add support for nested values
			const inputValue = propInputs[listedProp];

			// TODO -- show different inputs for different props. For example, we want a drop down menu for oneOf proptypes
			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

			if (propTypeDefinitions[listedProp].type === "enum") {
				return (
					<select name={listedProp} value={inputValue} onChange={(e) => this.handleSelectInput(e, ctx)}>
						<option value="red">red</option>
						<option value="green">green</option>
						<option value="blue">blue</option>
					</select>
				);
			}
			return (
				<div>
					<div>
						<input
							onClick={e => e.stopPropagation()}
							type="text"
							onChange={this.handlePropInput}
							value={inputValue}
						/>
						<span
							onClick={safeClick(() => this.setPropInHierarhcy(ctx, listedProp, inputValue))}
						>
							{"SET"}
						</span>
					</div>
				</div>
			);
		}

		renderPropSwitcher = (ctx) => {
			const { listedProp, props } = this.state;

			// render a list of all props that can be edited. We'll omit any props added by react dnd etc.
			if (props) {
				const cleanProps = getCleanProps(props);
				const keys = Object.keys(cleanProps);
				const propList = keys.map(prop => {
					return (
						<div
							key={prop}
							onClick={safeClick(() => this.showPropList(prop))}
						>
							{prop}
							{listedProp && listedProp === prop && this.renderPropInput(ctx)}
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
			const { isOverCurrent, connectDropTarget, ctx } = this.props;

			const style = isOverCurrent ? { borderLeft: "4px solid green" } : {};

			return (
				<div
					style={{ position: "relative", borderLeft: this.state.propSwitcher && "4px solid orange" }}
					onClick={((e) => this.handleComponentClick(e, ctx))}
				>
					<div style={{ position: "relative" }}>{this.state.propSwitcher && this.renderPropSwitcher(ctx)}</div>
					{
						connectDropTarget(
							<div style={style}>
								<WrappedComponent {...restProps}>
									{children || this.props.children}
								</WrappedComponent>
							</div>
						)}
				</div>
			);
		}
	}
	return DropTarget("card", dropSource, dropCollect)(ConfigurableComponent);
};

export default configurable;

