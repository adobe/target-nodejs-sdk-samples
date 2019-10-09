# Target traces sample

## Usage
1. Install dependencies: `npm i`
2. Start: `npm start`

## How it works
Target Node.js SDK allows you to send a trace token that will be used by Target edge to generate execution traces.
These traces can then be exposed in the page context, so Chrome extensions or other tools could display trace details.

The current sample looks for trace token in a query string parameter named `authorization` and the trace data is 
placed into a JavaScript object named `window.___target_traces`.

In order to generate a trace token please follow these steps:
1. Login to Experience Cloud
2. Launch the Target UI
3. In Target UI top navigation bar select `Setup`
4. Next, from the left navigation bar select `Implementation`
5. At the bottom of the page you should find `Debugger Tools` settings
6. Click on the `Generate Authentication Token` button

Once you have the trace token and the sample app is running to see everything in action you should open:
[http://localhost:3000?authorization=YOUR_TRACE_TOKEN](http://localhost:3000?authorization=YOUR_TRACE_TOKEN)

NOTE: make sure to replace `YOUR_TRACE_TOKEN` with the appropriate token value.
