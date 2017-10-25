import React from "react";

import Helmet from "react-helmet";

// Use Helmet for document head management.
// Helmet can be connected to router state, for example. This is useful for SEO purposes.
// Here, as a simplistic example, we change the title to match the counter in our redux state.

const DocumentHead = (props) => (
	<Helmet>
		<meta charSet="utf-8" />
		<title>title</title>
		<link rel="canonical" href="http://mysite.com/example" />
	</Helmet>
);


export default DocumentHead;
