# Target only sample

The Target Node.js SDK can be used to retrieve personalized content from Target without forcing the use of ECID. 

```js
const TargetClient = require("@adobe/target-nodejs-sdk");

const targetClient = TargetClient.create({
  client: "acmeclient",
  organizationId: "1234567890@AdobeOrg"
});

const request = {
  execute: {
    mboxes: [{
      name: "a1-serverside-ab"
    }]
  }
};

try {
  const response = await targetClient.getOffers({ request });
  console.log('Response', response);
} catch (error) {
  console.error('Error', error);
}
```

By default, the Target Node.js SDK generates a new session ID for every Target call, 
 which might not always be the desired behavior. To ensure that Target properly tracks the user session,
you should ensure that the Target cookie is sent to the browser after Target content is retrieved
 and the Target cookie value is passed to `getOffers()`/`sendNotifications()` as an incoming request is processed.  
The original request URL should also be passed in the `address` field of the Delivery request. 

## Usage
1. Install dependencies: `npm i`
2. Start: `npm start`
