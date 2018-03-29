/**
 * Implements the drag source contracts.
 */
export const cardSource = {
	beginDrag(props) {
		return {
			componentType: props.componentType,
		};
	},
};

export const treeSource = {
	beginDrag(props) {
		return props;
	},
};

/**
 * Specifies the props to inject into your component.
 */
export const dragCollect = (connect, monitor) => {
	return {
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging(),
	};
};


export const dropCollect = (connect, monitor) => {
	return {
		connectDropTarget: connect.dropTarget(),
		isOverCurrent: monitor.isOver({ shallow: true }),
	};
};


export const dropSource = {
	drop(props, monitor) {
		console.log("props", props);
		const hasDroppedOnChild = monitor.didDrop();
		// prevent deep updates

		if (hasDroppedOnChild) {
			return;
		}

		const draggedComponentProps = monitor.getItem();

		console.log("draggedComponentProps", draggedComponentProps);
		if (draggedComponentProps.hierarchyPath === props.hierarchyPath) {
			// dropped component on itself. Dont do anything.
			return;
		}
		console.log("draggedComponentProps.hierarchyPath", draggedComponentProps.hierarchyPath);
		if (draggedComponentProps.hierarchyPath) {
			// it's a move!
			props.ctx.moveInHierarchy(draggedComponentProps.hierarchyPath, props.hierarchyPath);
			return;
		}

		// it's an add
		props.ctx.addToHierarchy(draggedComponentProps, props.hierarchyPath);
		return;
	},
};
