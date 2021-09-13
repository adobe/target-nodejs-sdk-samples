# Target React shopping cart sample

## Overview

A React/Redux shopping cart sample using the full potential Target Node.js SDK by prefetching the content for React app views on the server-side and injecting these in the content returned on first page load, thus enabling instant application of Target offers on the client side, without any additional Target calls initiated by Target client at.js library. 

## How it works

Target `serverState` is a new feature available in at.js v2.2+, that allows at.js to apply Target offers directly from content fetched on the server side and returned to the client as part of the page being served.

In order to use this feature with Target Node.js SDK, we just have to set `window.targetGlobalSettings.serverState` object in the returned page, from Target Delivery API request and response objects available after a successfull `getOffers()` API call.

So, in our Node app serving the React SPA, we first perform a `getOffers()` Target Node.js SDK API call, in order to prefetch Target content for all app views:

```js
// Build the Delivery API View Prefetch request
const prefetchViewsRequest = {
    prefetch: {
        views: [{ address: getAddress(req) }]
    }
};
// Build Target Node.js SDK API getOffers options
const options = Object.assign({ request }, getTargetCookieOptions(req));
// Call Target Node.js SDK getOffers asynchronously
const targetResponse = await targetClient.getOffers(options);
```

After the `getOffers()` call completes successfully, we can create the `serverState` object and replace it in the HTML page template, before sending it back to the client:

```js
// Set the serverState object, which at.js will use on the client-side to immediately apply Target offers
const serverState = {
    request: targetResponse.request,
    response: targetResponse.response
};
// Build the final HTML page by replacing the Target config and state placeholders with appropriate values
let result = TEMPLATE.replace(/\$\{organizationId\}/g, CONFIG.organizationId)
    .replace("${clientCode}", CONFIG.client)
    .replace("${visitorState}", JSON.stringify(targetResponse.visitorState))
    .replace("${serverState}", JSON.stringify(serverState, null, " "));
// Send the page to the client with a 200 OK HTTP status
res.status(200).send(result);
```

A sample `serverState` object JSON for view prefetch looks as follows:
```json
{
 "request": {
  "requestId": "076ace1cd3624048bae1ced1f9e0c536",
  "id": {
   "tntId": "08210e2d751a44779b8313e2d2692b96.21_27"
  },
  "context": {
   "channel": "web",
   "timeOffsetInMinutes": 0
  },
  "experienceCloud": {
   "analytics": {
    "logging": "server_side",
    "supplementalDataId": "7D3AA246CC99FD7F-1B3DD2E75595498E"
   }
  },
  "prefetch": {
   "views": [
    {
     "address": {
      "url": "my.testsite.com/"
     }
    }
   ]
  }
 },
 "response": {
  "status": 200,
  "requestId": "076ace1cd3624048bae1ced1f9e0c536",
  "id": {
   "tntId": "08210e2d751a44779b8313e2d2692b96.21_27"
  },
  "client": "testclient",
  "edgeHost": "mboxedge21.tt.omtrdc.net",
  "prefetch": {
   "views": [
    {
     "name": "home",
     "key": "home",
     "options": [
      {
       "type": "actions",
       "content": [
        {
         "type": "setHtml",
         "selector": "#app > DIV.app-container:eq(0) > DIV.page-container:eq(0) > DIV:nth-of-type(2) > SECTION.section:eq(0) > DIV.container:eq(1) > DIV.heading:eq(0) > H1.title:eq(0)",
         "cssSelector": "#app > DIV:nth-of-type(1) > DIV:nth-of-type(1) > DIV:nth-of-type(2) > SECTION:nth-of-type(1) > DIV:nth-of-type(2) > DIV:nth-of-type(1) > H1:nth-of-type(1)",
         "content": "<span style=\"color:#FF0000;\">Latest</span> Products for 2020"
        }
       ],
       "eventToken": "t0FRvoWosOqHmYL5G18QCZNWHtnQtQrJfmRrQugEa2qCnQ9Y9OaLL2gsdrWQTvE54PwSz67rmXWmSnkXpSSS2Q==",
       "responseTokens": {
        "profile.memberlevel": "0",
        "geo.city": "dublin",
        "activity.id": "302740",
        "experience.name": "Experience B",
        "geo.country": "ireland"
       }
      }
     ],
     "state": "J+W1Fq18hxliDDJonTPfV0S+mzxapAO3d14M43EsM9f12A6QaqL+E3XKkRFlmq9U"
    }
   ]
  }
 }
}
```

Here's what happens next, once the page is retrieved and rendered by the client's browser:

 * On initialization, at.js reads and caches the Target offers for app views, prefetched on the server-side and set
 in `window.targetGlobalSettings.serverState`.
 * As soon as a Target view is triggered in the React app via 
 [triggerView() at.js API](https://docs.adobe.com/content/help/en/target/using/implement-target/client-side/functions-overview/adobe-target-triggerview-atjs-2.html)
 , at.js will immediately apply the content for that Target view from `serverState`, without going over the wire to fetch
 Target content.
 * Instead of prehiding the whole page BODY, at.js will only prehide the DOM elements for which Target offers are 
 available in the serverState content fetched server-side, thus positively impacting page load performance and end-user experience.

### Important notes 
- At the moment, at.js v2.2 supports only Page Load and View Prefetch for `serverState` scenarios. Support for mboxes may 
be provided in a future at.js release
- When applying `serverState` offers, at.js takes into consideration `pageLoadEnabled` and `viewsEnabled` settings, e.g.
Page Load offers will not be applied if `pageLoadEnabled` setting is `false`

## Try it out

If you're already a Target client, try it out in your Experience Cloud Organization, as follows:
1. Modify `client`, `organizationId` and `serverDomain` settings in `config.json` with the approprate values for your Target account.
2. Start the Node server on localhost: `npm run build && npm start`. By default, the server starts listening on `http://localhost:4444`, however the port can be customized in NPM scripts inside `package.json`.
3. Login to your Adobe Experience Cloud account, and open the Target UI. Create a new `A/B Test` activity and indicate `http://localhost:4444` as the `Activity URL`.
4. You can now experiment with authoring different experiences and seeing how these are delivered via Target Node.js SDK and applied by at.js using Target serverState.

## Usage

1. Install dependencies: `npm i`
2. Dev build: `npm run dev && npm start`
3. Prod build: `npm run build && npm start`
