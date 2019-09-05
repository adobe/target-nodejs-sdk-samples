# Target Node.js Client Samples & Demos

This repository contains samples and demos for the Target Node.js Client

## Demos

- [react-shopping-cart-demo](react-shopping-cart-demo) - a demo showing how to fetch and inject Target offers in a
[React Redux](https://react-redux.js.org/) app on the server side and then instantly apply the offers on the client side,
without any additional client-side Target calls
- [next-server-side-rendering-demo](next-server-side-rendering-demo) - a demo showing how to fetch and inject Target offers 
in a [Next.js](https://nextjs.org/) server-side rendered app, and then instantly apply the offers on the client side,
without any additional client-side Target calls

## Samples

- [target-only](target-only) - shows how Target Node.js Client can be used in isolation
- [ecid-integration](ecid-integration) - shows how Target Node.js Client can be used in conjunction with ECID (Visitor API)
- [ecid-customer-ids-integration](ecid-customer-ids-integration) - shows how Target Node.js Client can be used in 
conjunction with ECID (Visitor API) and Customer IDs, useful for tracking user authentication.
- [ecid-analytics-integration](ecid-analytics-integration) - shows how Target Node.js Client can be used in conjunction 
with ECID (Visitor API) and Adobe Analytics.
- [ecid-analytics-atjs-integration](ecid-analytics-atjs-integration) - shows how Target Node.js Client can be used in 
conjunction with ECID (Visitor API), Adobe Analytics and at.js. This sample shows how to run testing in "hybrid" mode,
when the test is started on the server side and then it is handed off to at.js on the client side.
- [target-traces](target-traces) - shows how Target Node.js Client can be used to retrieve Target execution traces.
- [shared-ecid-analytics-integration](shared-ecid-analytics-integration) - shows how to properly handle multiple Target 
Node.js Client API calls when processing a client request, sharing the same ECID instance.
- [multiple-mbox-ecid-analytics-atjs-integration](multiple-mbox-ecid-analytics-atjs-integration) - shows how Target 
Node.js Client can be used to request content for multiple mboxes in the same Target call.

For Target Node.js Client documentation, see [Target Node.js Client documentation](https://www.npmjs.com/package/@adobe/target-node-client)
