# Shared ECID and Analytics integration sample

This sample demonstrates the use-case of sharing of a common ECID Visitor instance across several 
Target client SDK `getOffers` calls.

By default, the Target client SDK instantiates a new ECID Visitor instance internally, on each `getOffers()` 
/ `sendNotifications()` call. However, when there's a need to share a single ECID Visitor instance, this can be 
achieved by explicitly instantiating one and setting it in the Target client SDK via a call to `setVisitor()` 
API method. Any subsequent calls to Target client SDK API will use the provided Visitor instance.  
In this case, there's also no need to provide the VisitorId cookie (`options.visitorCookie`) in calls to 
Target client SDK API methods, as it's only required for internal Visitor instantiation.

In the provided sample the two Target calls are executed concurrently.  
Note the use of distinct `consumerIds` in each call, for proper subsequent stitching with Analytics.

Also note that a single `getOffers()` call with multiple mboxes/views should generally be preferred over multiple
`getOffers()` calls with a shared Visitor instance.

## Usage
1. Install dependencies: `npm i`
2. Start: `npm start`

