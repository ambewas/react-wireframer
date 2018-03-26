import { keys, omit } from "ramda";
import { getCleanProps } from "./helpers";

const getPropString = (props) => {
	const propKeys = keys(props);

	return propKeys
		.filter(key => props[key])
		.map(key => {
			if (typeof props[key] === "object") {
				return ` ${key}={${JSON.stringify(props[key])}}`;
			}
			return ` ${key}="${props[key]}"`;
		});
};

const getElementString = (element, children, props) => {
	const childString = Array.isArray(children) ? children.join("") : children;

	return `<${element}${getPropString(props).join("")}>${childString}</${element}>`;
};

const generateJSX = (json) => {
	if (Array.isArray(json) && json.length > 0) {
		return json.map((jsonElement) => {
			const element = jsonElement.type;
			const props = omit(["children"], getCleanProps(jsonElement.props));

			const elementString = getElementString(element, generateJSX(jsonElement.props.children), props);

			return elementString;
		});
	}

	return json;
};

export default generateJSX;


/**
 * hierarchyPath not needed
 */
