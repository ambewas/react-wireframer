/**
 * todo
 *
 * move prop input handling to separate component
 * render this input handler inside Layouter, which is a more logical structure.
 *
 * handle oneOfType -> selectbox for the type, then render the type input
 */

import React, { Component } from "react";

import {
	omit,
	propEq,
	compose,
	keys,
	filter,
} from "ramda";

import {
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

		getWrappedComponentProps = () => {
			let props;

			if (WrappedComponent.propTypes) {
				// filter out all function props; We can't do anything with them anyway.
				const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

				// build a props object based on these keys and shapeTypes.
				props = Object.keys(propTypeDefinitions).reduce((acc, key) => {
					const keyValue = propTypeDefinitions[key] && propTypeDefinitions[key].type === "shape" ? getPropTypeShape(propTypeDefinitions[key].shapeTypes) : undefined;

					return {
						...acc,
						[key]: keyValue,
						children: this.props.children,
					};
				}, {});
			}
			console.log("props", props);
			return { ...props };
		}

		passPropSwitcherData = (e) => {
			e.stopPropagation();
			const { props } = this.state;
			const { ctx } = this.props;
			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

			if (props) {
				// pass the definitions and path to Layouter.
				ctx.setPropListInSwitcher(propTypeDefinitions, this.props.hierarchyPath);
			}
		}

		render() {
			const { children, ...restProps } = this.state.props;
			const { isOverCurrent, connectDropTarget, connectDragSource, ctx } = this.props;

			const isActive = ctx && (this.props.hierarchyPath === ctx.activeComponentHierarchyPath);
			const style = isOverCurrent || isActive ? { borderLeft: "4px solid green" } : {};

			const cleanProps = getCleanProps(restProps);

			return (
				<div
					style={{ position: "relative" }}
				>
					{
						connectDropTarget(
							connectDragSource(
								<div
									style={style}
									onClick={this.passPropSwitcherData} // eslint-disable-line
								>
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

