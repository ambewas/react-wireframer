import configurable from "./configurable";
import Button from "../components/button";
import Row from "../components/row";

console.log("Button", Button);
console.log("Row", Row);
const config = {
	components: {
		Row,
		Button,
	},
};

export default configurable(config);
