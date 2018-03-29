import React, { Component } from "react";
import { findDOMNode } from "react-dom";

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

		componentDidMount() {
			const { connectDragSource, connectDropTarget } = this.props;

			this.componentNode = findDOMNode(this.componentInstance) || this.componentInstance;  // eslint-disable-line

			if (this.componentNode && !this.originalBorderleft) {
				this.originalBorderleft = this.componentNode.style.borderLeft;
			}

			if (this.componentNode) {
				this.componentNode.addEventListener("click", this.passPropSwitcherData);
				// TODO -- not really working...
				// this.componentNode.style.borderLeft = isOverCurrent || isActive ? "4px solid green" : this.originalBorderleft;
				connectDragSource(this.componentNode);
				connectDropTarget(this.componentNode);
			}
		}

		componentWillUnmount() {
			this.componentNode.removeEventListener("click", this.passPropSwitcherData);
		}

		passPropSwitcherData = (e) => {
			e.stopPropagation();
			const { ctx } = this.props;
			const propTypeDefinitions = PropTypes.getPropTypeDefinitions(WrappedComponent.propTypes);
			// pass the definitions and path to Layouter.

			ctx.setPropListInSwitcher(propTypeDefinitions, this.props.hierarchyPath);
		}

		render() {
			const { children, ...restProps } = this.props;

			const cleanProps = getCleanProps(restProps);


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

			return (
				<WrappedComponent
					{...hackyProps}
					ref={instance => this.componentInstance = instance}
				>
					{children || this.props.children}
				</WrappedComponent>
			);
		}
	}

	return compose(
		DragSource("card", treeSource, dragCollect),
		DropTarget("card", dropSource, dropCollect)
	)(ConfigurableComponent);
};

export default configurable;
