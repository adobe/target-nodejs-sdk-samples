# Advanced at.js integration via serverState sample

In the `ecid-analytics-atjs-integration` sample, we've showcased "hybrid" Target integration, where both the server-side and the client-side Target libraries are hitting the same Target edge cluster, sharing the same Target session and visitor state. However, at.js still needs to go over the wire for fetching Target content in the browser, prehiding the whole page BODY until Target offers are fetched and applied.

But what if we could prefetch the Target content on the server-side, include it in the page returned to the client, and then just have at.js apply the Target offers immediately, without making another expensive network call?
Also, in this case at.js will be able to prehide only the specific DOM elements for which Target offers have been fetched on the server-side, thus no longer requiring the prehiding of the whole page BODY.

Target `serverState` is a new feature available in at.js 2.x, that allows at.js to apply Target offers directly from content fetched on the server side and returned to the client as part of the page being served.

In order to use this feature with Target Node.js SDK we just have to set `window.targetGlobalSettings.serverState` object in the returned page, from Target Delivery API request and response objects available after a successfull `getOffers()` API call, as follows:

```js
// First, we fetch the offers via Target Node.js SDK API, as usual
const targetResponse = await targetClient.getOffers(options);
// A successfull response will contain Target Delivery API request and response objects, which we need to set as serverState
const serverState = {
  request: targetResponse.request,
  response: targetResponse.response
};
// Finally, we should set window.targetGlobalSettings.serverState in the returned page, by replacing it in a page template, for example
const PAGE_TEMPLATE = `
<!doctype html>
<html>
<head>
  ...
  <script>
    window.targetGlobalSettings = {
      overrideMboxEdgeServer: true,
      serverState: ${JSON.stringify(serverState, null, " ")}
    };
  </script>
  <script src="at.js"></script>
</head>
...
</html>
`;
// Return PAGE_TEMPLATE to the client ...
```

Once the page is loaded in the browser, at.js will apply all the Target offers from `serverState` immediately, without firing any network calls against the Target edge. Additionally, at.js will only prehide the DOM elements for which Target offers are available in the content fetched server-side, thus greatly improving page load performance and end-user experience.

Note: In case of SPAs using [Target Views and triggerView() at.js API](https://docs.adobe.com/content/help/en/target/using/implement-target/client-side/functions-overview/adobe-target-triggerview-atjs-2.html), at.js will cache the content for all Views prefetched on the server-side and apply these as soon as each View is triggered via `triggerView()`, again without firing any additional content-fetching calls to Target.

## Usage
1. Install dependencies: `npm i`
2. Start: `npm start`
