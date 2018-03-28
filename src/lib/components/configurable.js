import React, { Component } from "react";

import {
	compose,
} from "ramda";

import * as R from "ramda";
import {
	getPropTypeShape,
	getCleanProps,
} from "../helpers/helpers";

import { DropTarget, DragSource } from "react-dnd";
import { dropSource, dropCollect, treeSource, dragCollect } from "../helpers/dragDropContracts";


const configurable = (WrappedComponent, PropTypes) => {
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
			if (WrappedComponent.propTypes) {
				// filter out all function props; We can't do anything with them anyway.
				const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

				// build a props object based on these keys and shapeTypes.
				return Object.keys(propTypeDefinitions).reduce((acc, key) => {
					const keyValue = propTypeDefinitions[key] && propTypeDefinitions[key].type === "shape" ? getPropTypeShape(propTypeDefinitions[key].shapeTypes) : undefined;

					return {
						...acc,
						[key]: keyValue,
						children: this.props.children,
					};
				}, {});
			}
			return {};
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

			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);

			/**
			|--------------------------------------------------
			| NOTICE! ugly hack coming up...
			|--------------------------------------------------
			*/
			/**
			 * and now for an extremely dirty hack to support arrayOf propTypes.... let's turn it into an array!
			 * I feel so dirty... but this is the fastest way to solve this problem right now. A refactor is necessary to otherwise support it.
			 * The unfortunate side effect of this is that this hack means the state tree is no longer the single source of truth...
			 */
			const hackyBuildProps = (props, last) => Object.keys(props).reduce((acc, curr) => {
				const path = last ? `${last}.${curr}` : curr;

				const propDefinition = R.view(R.lensPath(path.split(".")), propTypeDefinitions);

				let value;

				if (propDefinition && propDefinition.type === "arrayOf") {
					value = [props[curr]];
				} else {
					value = props[curr];
				}

				if (propDefinition && propDefinition.type === "shape") {
					value = hackyBuildProps(props[curr], `${curr}.shapeTypes`);
				}

				return {
					...acc,
					[curr]: value,
				};
			}, {});


			const hackyProps = hackyBuildProps(cleanProps);

			return connectDropTarget(
				connectDragSource(
					<div
						style={style}
						// unfortunate side-effect of drag-drop. This should ideally be a fragment, but it is not possible.
						// so to allow classNames for positioning things, let's add it to the outer div
						// side-effects will occur, unfortunately :(
						className={hackyProps.className}
						onClick={this.passPropSwitcherData} // eslint-disable-line
					>
						<WrappedComponent {...hackyProps}>
							{children || this.props.children}
						</WrappedComponent>
					</div>
				)
			);
		}
	}

	return compose(
		DragSource("card", treeSource, dragCollect),
		DropTarget("card", dropSource, dropCollect)
	)(ConfigurableComponent);
};

export default configurable;
