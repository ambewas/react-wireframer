import { keys } from "ramda";

const getPropString = (props) => {
	const propKeys = keys(props);

	return propKeys
		.filter(key => props[key])
		.map(key => {
			return ` ${key}="${props[key]}"`;
		});
};

const getElementString = (element, children, props) => `<${element}${getPropString(props).join("")}>${children.join("")}</${element}>`;

const generateJSX = (json) => {
	return json.map((jsonElement) => {
		const element = jsonElement.type;
		const elementString = getElementString(element, generateJSX(jsonElement.children), jsonElement.props);

		return elementString;
	});
};

export default generateJSX;
