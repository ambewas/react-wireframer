import React, { Component } from "react";

import {
	compose,
} from "ramda";

import * as R from "ramda";
import {
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


		passPropSwitcherData = (e) => {
			e.stopPropagation();
			const { ctx } = this.props;
			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);
			// pass the definitions and path to Layouter.

			ctx.setPropListInSwitcher(propTypeDefinitions, this.props.hierarchyPath);
		}

		render() {
			const { children, isOverCurrent, ctx, connectDragSource, connectDropTarget, ...restProps } = this.props;

			const cleanProps = getCleanProps(restProps);
			const isActive = this.props.hierarchyPath === ctx.activeComponentHierarchyPath;

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
			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);
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
			/**
			|--------------------------------------------------
			| end of hacky props..
			|--------------------------------------------------
			*/

			return connectDragSource(connectDropTarget(
				<div
					onClick={this.passPropSwitcherData} // eslint-disable-line
					className={(isOverCurrent || isActive) ? "__layouter-hovering" : undefined}
				>
					<WrappedComponent
						{...hackyProps}
					>
						{children || this.props.children}
					</WrappedComponent>
				</div>
			));
		}
	}

	return compose(
		DragSource("card", treeSource, dragCollect),
		DropTarget("card", dropSource, dropCollect)
	)(ConfigurableComponent);
};

export default configurable;
