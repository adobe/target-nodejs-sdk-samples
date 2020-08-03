# Target feature flag sample

## Overview

For this sample, we first created two simple AB activities.  One to represent feature flags for engineering purposes and another for marketing purposes.  Each activity has two experiences that have JSON offer content.  The JSON holds unique key value pairs that are used by the sample app to determine what engineering systems to use and marketing content to show.  

### Engineering Feature Flags Activity 
mbox: `demo-engineering-flags`

#### Experience A
```json
{
    "cdnHostname": "cdn.cloud.corp.net",
    "searchProviderId": "starwars",
    "hasLegacyAccess": false
}
```

#### Experience B
```json
{
    "cdnHostname": "cdn.megacloud.corp.com",
    "searchProviderId":"startrek",
    "hasLegacyAccess": true
}
```

### Marketing Activity
mbox: `demo-marketing-offer1`

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

When run, the sample app displays a marketing banner and a search box.  The marketing banner is different depending on the `asset` value of the `demo-marketing-offer1` mbox. And the search experience differs depending on the `searchProviderId` value of the `demo-engineering-flags` mbox.  If the value is `starwars`,a [Star Wars API](https://swapi.co/) is used to search for characters.  If the value is `startrek`, a [Star Trek API](http://stapi.co/) is used to search for characters.

In this sample, the `getAttributes` call is used to greatly simplify accessing the JSON offer.  Typically, a developer would need to find the JSON offer object in the response of the `getOffers` call.  This is done in other samples.  It is straightforward, but can be cumbersome -- and it requires developers to be intimately familiar with the SDK response object.  

Instead, this sample uses the `getAttributes` call to get the offer instead.  It then looks up the value of each attribute using one of the helper methods.

## Running the sample
1. Install dependencies: `npm i`
2. Start: `npm start`
3. Point a browser to http://127.0.0.1:3000


## How it works

In the code sample below, take a look at the `getAttributes` call.  An array of mbox names and an options object is passed in.  The result is an attributes object with a few methods that can be used to get offer details.

The `getValue` method is used to get the `searchProviderId` from the `demo-engineering-flags` mbox offer.

And the `asObject` method is used to get a plain old JSON representation of the `demo-marketing-offer1` mbox offer.

```js
    const targetClient = TargetClient.create(CONFIG);
    const offerAttributes = await targetClient.getAttributes([
        "demo-engineering-flags",
        "demo-marketing-offer1",
    ], { targetCookie });
    

    //returns just the value of searchProviderId from the mbox offer
    const searchProviderId = offerAttributes.getValue("demo-engineering-flags", "searchProviderId");	
    
    //returns a simple JSON object representing the mbox offer
    const marketingOffer = offerAttributes.asObject("demo-marketing-offer1");
	
    //  the value of marketingOffer looks like this
    //  {
    //      "experience": "A",
    //      "asset": "demo-marketing-offer1-exp-A.png"
    //  }
	
```

Note: This sample uses on-device decisioning method.  But the `getAttributes` method can be used in any decisioning method.
