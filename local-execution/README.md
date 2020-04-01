# Target Local execution sample

The Target Node.js SDK can be used to determine personalized content without making a request to the delivery api each time.  This is a new feature, currently only available in the alpha version of the sdk.


## Demo

This demo utilizes local execution mode for determining target experiences.  By default, the SDK always makes a request to the target delivery API for each getOffers call.  But you can configure the SDK to use local execution mode instead.  This mode downloads target activity rules on initialization, then uses it to determine target outcomes when getOffers is called, instead of making a request to the delivery API each time.  

There are three properties to keep in mind when using local execution mode:

| Name                      | Description                                                                         |
|---------------------------|-------------------------------------------------------------------------------------|
| executionMode             | The execution mode the SDK will run in.  Can be `local`, `remote`, or `hybrid`      |
| artifactLocation          | This is a fully qualified url to the rules definition file that will be used to determine outcomes locally.  During the alpha, this value is required.      |
| clientReadyCallback       | A callback function that will be invoked when the SDK is ready for getOffers method calls.  This is required for local execution mode.      |


```js
const CONFIG = {
  executionMode: "local",
  artifactLocation: "https://assets.staging.adobetarget.com/adobesummit2018/waters_test/rules.json",
  clientReadyCallback: targetReady
};

const targetClient = TargetClient.create(CONFIG);

function targetReady() {
    // make getOffers requests
    // targetClient.getOffers({...})            
}
```

Once configured in this way, and after the clientReadyCallback has been invoked, an app can make standard SDK method calls as normal.


### Usage
1. Install dependencies: `npm i`
2. Start: `npm start`
3. Point a browser to http://127.0.0.1:3000

## Getting started with the alpha

### Existing Projects

If you already have a project that uses a current version of target-nodejs-sdk, you can try the alpha by simply finding the target-nodejs-sdk entry in the dependencies section of package.json, and set it's value to "alpha".

```json
{  
  "dependencies": {
    "@adobe/target-nodejs-sdk": "alpha"
  }
}
```

Then run `npm install` and you'll have the latest alpha installed.

### New Projects

If you are adding the SDK to a new project for the first time, simply run `npm install @adobe/target-nodejs-sdk@alpha` from the command line and you're all set.


