# Target on-device decisioning sample

## Overview

For this sample, we first created a simple AB activity for the `demo-marketing-offer1` mbox.  It has two experiences, each with JSON offer content.

### Experience A
```json
{
    "experience": "A",
    "asset": "demo-marketing-offer1-exp-A.png"
}
```
### Experience B

```json
{
    "experience": "B",
    "asset": "demo-marketing-offer1-exp-B.png"
}
```

As you can see, each experience has a different filename set in the `asset` property.

When run, the app server makes a getOffers call, requesting the `demo-marketing-offer1` mbox.  But the SDK has been configured to use on-device decisioning method to determine the outcome of the call rather than send a request to the target delivery API.

When the page is loaded in a browser, an image is shown at the top of the page.  This image comes from one of the two experiences in the activity defined above.  The target response is also shown on the page.

## Running the sample
1. Install dependencies: `npm i`
2. Start: `npm start`
3. Point a browser to http://127.0.0.1:3000


## How it works

This sample utilizes on-device decisioning method to determine target experiences.  By default, the SDK always makes a request to the target delivery API for each `getOffers` call.  But you can configure the SDK to use on-device decisioning method instead.  This mode downloads target activity rules on initialization.   The rules are then used to determine which experiences to return when `getOffers` is called, rather than make a request to the delivery API each time.

There are four main properties to keep in mind when using on-device decisioning method:

| Name                      | Description                                                                         |
|---------------------------|-------------------------------------------------------------------------------------|
| decisioningMethod         | The decisioning method the SDK will run in.  Can be `on-device`, `server-side`, or `hybrid`. Defaults to `server-side`      |
| artifactLocation          | This is a fully qualified url to the rules definition file that will be used to determine outcomes locally.  |
| artifactPayload           | A target decisioning JSON artifact. If specified, it is used instead of requesting one from a URL. |
| events                    |  Object.<String, Function>  | No      | None          | An optional object with event name keys and callback function values. |

NOTE: You must specify an `artifactLocation` or `artifactPayload` during the alpha release for on-device decisioning method to work.

```js
const CONFIG = {
    decisioningMethod: "on-device",
    artifactPayload: require("sampleRules"),
    events: { clientReady: targetReady }
};

const targetClient = TargetClient.create(CONFIG);

function targetReady() {
    // make getOffers requests
    // targetClient.getOffers({...})            
}
```

Once configured in this way, and after the `clientReady` event callback has been invoked, an app can make standard SDK method calls as normal.
