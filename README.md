# Target Node.js SDK Samples & Demos

This repository contains samples and demos for the [Target Node.js SDK](https://www.npmjs.com/package/@adobe/target-nodejs-sdk)

## Demos

- [react-shopping-cart-demo](react-shopping-cart-demo) - a demo showing how to fetch and inject Target offers in a
[React Redux](https://react-redux.js.org/) app on the server side and then instantly apply the offers on the client side,
without any additional client-side Target calls. Check out the [Live Demo](http://target-nodejs-react-sample.eu-west-1.elasticbeanstalk.com).
- [next-server-side-rendering-demo](next-server-side-rendering-demo) - a demo showing how to fetch and inject Target offers 
in a [Next.js](https://nextjs.org/) server-side rendered app, and then instantly apply the offers on the client side,
without any additional client-side Target calls. Check out the [Live Demo](http://target-nodejs-ssr-sample.eu-west-1.elasticbeanstalk.com).

## Samples

- [target-only](target-only) - shows how Target Node.js SDK can be used in isolation
- [ecid-integration](ecid-integration) - shows how Target Node.js SDK can be used in conjunction with ECID (Visitor API)
- [ecid-customer-ids-integration](ecid-customer-ids-integration) - shows how Target Node.js SDK can be used in 
conjunction with ECID (Visitor API) and Customer IDs, useful for tracking user authentication.
- [ecid-analytics-integration](ecid-analytics-integration) - shows how Target Node.js SDK can be used in conjunction 
with ECID (Visitor API) and Adobe Analytics.
- [ecid-analytics-atjs-integration](ecid-analytics-atjs-integration) - shows how Target Node.js SDK can be used in 
conjunction with ECID (Visitor API), Adobe Analytics and at.js. This sample shows how to run testing in "hybrid" mode,
when the test is started on the server side and then it is handed off to at.js on the client side.
- [advanced-atjs-integration-serverstate](advanced-atjs-integration-serverstate) - shows how to use at.js v2.2+ **serverState** feature to apply Target offers fetched on the server side, without any additional client side content-fetching Target calls.
- [target-traces](target-traces) - shows how Target Node.js SDK can be used to retrieve Target execution traces.
- [shared-ecid-analytics-integration](shared-ecid-analytics-integration) - shows how to properly handle multiple Target 
Node.js SDK API calls when processing a client request, sharing the same ECID instance.
- [multiple-mbox-ecid-analytics-atjs-integration](multiple-mbox-ecid-analytics-atjs-integration) - shows how Target 
Node.js SDK can be used to request content for multiple mboxes in the same Target call.
- [on-device-decisioning](on-device-decisioning) - shows how Target Node.js SDK can be used in on-device decisioning method
- [feature-flag](feature-flag) - shows how Target Node.js SDK can be easily used for feature flags

For Target Node.js SDK documentation, see [Target Node.js SDK NPM page](https://www.npmjs.com/package/@adobe/target-nodejs-sdk).

## Contributing

Check out our [Contribution guidelines](.github/CONTRIBUTING.md) as well as [Code of Conduct](CODE_OF_CONDUCT.md) prior
to contributing to Target Node.js SDK samples.
