import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
	static async getInitialProps(ctx) {
		const initialProps = await Document.getInitialProps(ctx);
		return { ...initialProps };
	}

	render() {
		return (
			<Html>
				<Head>
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1.0"
					></meta>
					<link
						rel="stylesheet"
						href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"
					></link>
				</Head>
				<body style={{ maxWidth: "100%" }}>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
