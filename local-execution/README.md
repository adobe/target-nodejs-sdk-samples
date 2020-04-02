# Target Local execution sample

This sample makes a getOffers call for the `demo-marketing-offer1` mbox.  The SDK is configured to use local execution mode to determine the outcome of the call rather make a request to the target delivery API.

## Running the sample
1. Install dependencies: `npm i`
2. Start: `npm start`
3. Point a browser to http://127.0.0.1:3000

Notice the image at the top of the page.  It will be different depending on the experience provided from target.  The target response is also shown on the page.


## Additional Details

This sample utilizes local execution mode to determine target experiences.  By default, the SDK always makes a request to the target delivery API for each getOffers call.  But you can configure the SDK to use local execution mode instead.  This mode downloads target activity rules on initialization.   These rules are then used to determine target outcomes when getOffers is called, instead of making a request to the delivery API each time.  

There are three properties to keep in mind when using local execution mode:

| Name                      | Description                                                                         |
|---------------------------|-------------------------------------------------------------------------------------|
| executionMode             | The execution mode the SDK will run in.  Can be `local`, `remote`, or `hybrid`. Defaults to `remote`      |
| artifactLocation          | This is a fully qualified url to the rules definition file that will be used to determine outcomes locally.  During the alpha, this value is required.      |
| clientReadyCallback       | A callback function that will be invoked when the SDK is ready for getOffers method calls.  This is required for local execution mode.      |


```js
const CONFIG = {
  executionMode: "local",
  artifactLocation: ".../path/to/decisioning/rules.json", // This is only necessary during the alpha
  clientReadyCallback: targetReady
};

const targetClient = TargetClient.create(CONFIG);

function targetReady() {
    // make getOffers requests
    // targetClient.getOffers({...})            
}
```

Once configured in this way, and after the clientReadyCallback has been invoked, an app can make standard SDK method calls as normal.
