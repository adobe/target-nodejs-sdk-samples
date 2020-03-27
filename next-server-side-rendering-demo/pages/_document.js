import Document, { Html, Head, Main, NextScript } from 'next/document';
import Target from '../helpers/target-server-side';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const targetProps = await Target.prefetchOffers(ctx);
    return { ...initialProps, target: targetProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <script src="static/VisitorAPI.js" />
          <script dangerouslySetInnerHTML={{
            __html: Target.visitorInit(this.props)
          }}
          />
          <script dangerouslySetInnerHTML={{
            __html: Target.targetInit(this.props)
          }}
          />
          <script src="static/at.js"></script>
        </Head>
        <body>
          <div className="container"></div>
          <Main />
          <NextScript />
          <script src="static/AppMeasurement.js"></script>
          <script dangerouslySetInnerHTML={{
            __html: Target.analyticsBeacon()
          }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
