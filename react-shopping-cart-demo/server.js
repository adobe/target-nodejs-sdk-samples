const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
// Load the Target NodeJS SDK library
const TargetClient = require("@adobe/target-nodejs-sdk");
// Load the Target configuration (replace with configurations specific to your Adobe Client & Org)
const CONFIG = require("./config.json");
// Load the template of the HTML page returned in the response
const TEMPLATE = fs.readFileSync(`${__dirname}/index.tpl`).toString();

// Initialize the Express app
const app = express();
const PORT = process.env.PORT;

// Enable TargetClient logging via the console logger
const targetOptions = Object.assign({ logger: console }, CONFIG);
// Create the TargetClient global instance
const targetClient = TargetClient.create(targetOptions);

// Setup cookie parsing middleware and static file serving from the /public directory
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));

/**
 * Sets cookies in the response object
 * @param res response to be returned to the client
 * @param cookie cookie to be set
 */
function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, { maxAge: cookie.maxAge * 1000 });
}

/**
 * Augments the HTML template with Target data and sends it to the client
 * @param res response object returned to the client
 * @param targetResponse response received from Target Delivery API
 */
function sendHtml(res, targetResponse) {
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

  if (CONFIG.serverDomain) {
    result = result.replace("${serverDomain}", CONFIG.serverDomain);
  } else {
    result = result.replace('serverDomain: "${serverDomain}"', "");
  }

  // Send the page to the client with a 200 OK HTTP status
  res.status(200).send(result);
}

/**
 * Returns the regular React app to the client, without any Target state, in case there was an error
 * with fetching Target data
 * @param res response object returned to the client
 */
function sendErrorHtml(res) {
  // Build the final HTML page, only Target config values are set in the template, for at.js initialization
  let result = TEMPLATE.replace(/\$\{organizationId\}/g, CONFIG.organizationId)
    .replace("${clientCode}", CONFIG.client)
    .replace("${visitorState}", "{}")
    .replace("${serverState}", "{}");

  if (CONFIG.serverDomain) {
    result = result.replace("${serverDomain}", CONFIG.serverDomain);
  } else {
    result = result.replace('serverDomain: "${serverDomain}"', "");
  }

  res.status(200).send(result);
}

/**
 * Return the headers to be set on the response object.
 * Note that Expires header is set to current Date, so the browser will always reload the page from the server
 * @returns {Object} response headers
 */
const getResponseHeaders = () => ({
  "Content-Type": "text/html",
  "Expires": new Date().toUTCString()
});

/**
 * Sets headers and target cookies on the response, and sends the page with injected Target data back to the client
 * @param res response object to be returned to the client
 * @param targetResponse response received from Target Delivery API
 */
function sendResponse(res, targetResponse) {
  res.set(getResponseHeaders());

  saveCookie(res, targetResponse.targetCookie);
  saveCookie(res, targetResponse.targetLocationHintCookie);
  sendHtml(res, targetResponse);
}

/**
 * Sets response headers and returns the page to the client, in case there was an error with fetching Target offers
 * @param res response object to be returned to the client
 */
function sendErrorResponse(res) {
  res.set(getResponseHeaders());

  sendErrorHtml(res);
}

/**
 * Extract the Visitor, Target session and location hint cookies from the client request
 * and return these as Target Node Client options
 * @param req client request object
 * @returns {Object} Target and Visitor cookies as Target Node Client options map
 */
function getTargetCookieOptions(req) {
  return {
    visitorCookie: req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)],
    targetCookie: req.cookies[TargetClient.TargetCookieName],
    targetLocationHintCookie: req.cookies[TargetClient.TargetLocationHintCookieName]
  };
}

/**
 * If a Target Trace token was sent in the "authorization" client request query parameter, then we also set it
 * in the Target request
 * @param trace Target Delivery API request trace object
 * @param req client request object
 * @returns {Object} Target Delivery API request with the Trace token set from the original request query parameter
 */
function setTraceToken(trace = {}, req) {
  const { authorizationToken = req.query.authorization } = trace;

  if (!authorizationToken || typeof authorizationToken !== "string") {
    return trace;
  }

  return Object.assign({}, trace, { authorizationToken });
}

/**
 * Call the Target Node Client getOffers API asynchronously and send the response with Target offers back to the client
 * @param request Target Delivery API request
 * @param req client request object
 * @param res client response object
 */
async function processRequestWithTarget(request, req, res) {
  // Set the trace data on the Delivery API request object, if available
  request.trace = setTraceToken(request.trace, req);
  // Build Target Node.js SDK API getOffers options
  const options = Object.assign({ request }, getTargetCookieOptions(req));

  try {
    // Call Target Node.js SDK getOffers asynchronously
    const resp = await targetClient.getOffers(options);
    // Send back the response with Target offers, getOffers call completes successfully
    sendResponse(res, resp);
  } catch (e) {
    // Alternatively, log the error and send the page without Target data
    console.error("AT error: ", e);
    sendErrorResponse(res);
  }
}

/**
 * Returns the Target request address, extracted from client request URL
 * @param req client request object
 * @returns {{url: *}} Target request address
 */
function getAddress(req) {
  return { url: req.headers.host + req.originalUrl }
}

// Setup the root route Express app request handler for GET requests
app.get("/", (req, res) => {
  // Build the Delivery API View Prefetch request
  const prefetchViewsRequest = {
    prefetch: {
      views: [{ address: getAddress(req) }]
    }
  };

  // Process the request by calling Target Node.js SDK API
  processRequestWithTarget(prefetchViewsRequest, req, res);
});

// Startup the Express server listener
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

// Stop the server on any app warnings
process.on("warning", e => {
  console.warn("Node application warning", e);
  process.exit(-1);
});
