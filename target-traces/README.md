# Target traces sample

## Usage
1. `npm install`
2. `npm run www`

## How it works
Marketing Cloud Client allows you to send a trace token that will be used by Target edge to generate execution traces. These traces can then be exposed to HTML page, so Chrome extensions or other tools could display trace details.

The current sample looks for trace token in a query string parameter named `authorization` and the trace data is placed into a JavaScript object named `window.___target_traces`.

If you are new to Target trace functionality please follow these steps to generate a trace token:
1. Login to Marketing Cloud
2. Navigate to Target
3. In Target UI top navigation bat select Setup
4. Next, from left navigation bar select Implementation
5. At the bottom of the page you should find Debugger Tools
6. Click on the `Generate Authentication Token` button

Once you have the trace token and the sample app is running to see everything in action you should open: http://localhost:3000?authorization=*\<your trace token\>*
