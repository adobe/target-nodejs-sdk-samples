# ECID, Analytics and at.js integration sample

Most of the time Target Node.js SDK will be used in a NodeJS application, such as `Express`, `Hapi`, `Koa`, etc.
However, with the recent proliferation of SPA frameworks that allow server-side rendering (such as Facebook React, 
Next.js or Angular), there are use cases where server-side code should work in tandem with client-side libraries.
In Target's case the client-side library is `at.js`.  
The integration between server-side and client-side is also known as "hybrid" testing mode. 
The biggest challenge in this case is ensuring that both server-side and client-side Target calls are hitting the same 
Target edge cluster. Otherwise, one may end up with different user profiles being created by server-side and client-side
calls for the same visitor.

To solve this, Target leverages the so-called "location hint" cookie. To be able to use the location hint cookie, the 
following JavaScript snippet must be added to the rendered page before `at.js` (or before the Target Adobe Launch extension
 is initialized when Adobe Launch tag manager is used):

```js
window.targetGlobalSettings = {
  overrideMboxEdgeServer: true
};
```

## Usage
1. Install dependencies: `npm i`
2. Start: `npm start`
