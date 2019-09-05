const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
// Load the Target NodeJS SDK library
// const TargetNodeClient = require("@adobe/target-node-client");
const TargetNodeClient = require("./tmp-node-client/index"); // Temp fix until NodeJS SDK is public
// Load the Target configuration (replace with configurations specific to your Adobe Client & Org)
const CONFIG = require("./config.json");
// Load the template of the HTML page returned in the response
const TEMPLATE = fs.readFileSync(`${__dirname}/index.tpl`).toString();

// Initialize the Express app
const app = express();
const PORT = process.env.PORT;

// Enable TargetNodeClient logging via the console logger
const targetOptions = Object.assign({ logger: console }, CONFIG);
// Create the TargetNodeClient global instance
const targetClient = TargetNodeClient.create(targetOptions);

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
 *
 * @param res response object returned to the client
 * @param targetResponse response received from Target Delivery API
 */
function sendResponse(res, targetResponse) {
  res.set({ "Content-Type": "text/html" });

  saveCookie(res, targetResponse.targetCookie);
  saveCookie(res, targetResponse.targetLocationHintCookie);
  sendHtml(res, targetResponse);
}

function sendErrorResponse(res) {
  res.set({ "Content-Type": "text/html" });

  sendErrorHtml(res);
}

function getCommonTargetOptions(req) {
  return {
    targetCookie:
      req.cookies[encodeURIComponent(TargetNodeClient.TargetCookieName)],
    targetLocationHintCookie:
      req.cookies[
        encodeURIComponent(TargetNodeClient.TargetLocationHintCookieName)
      ]
  };
}

function setTraceToken(trace = {}, req) {
  const { authorizationToken = req.query.authorization } = trace;

  if (!authorizationToken || typeof authorizationToken !== "string") {
    return trace;
  }

  return Object.assign({}, trace, { authorizationToken });
}

async function processTargetRequest(request, req, res) {
  request.trace = setTraceToken(request.trace, req);
  const options = Object.assign({ request }, getCommonTargetOptions(req));

  try {
    const resp = await targetClient.getOffers(options);
    sendResponse(res, resp);
  } catch (e) {
    console.error("AT: ", e);
    sendErrorResponse(res);
  }
}

app.get("/", (req, res) => {
  const prefetchViewsRequest = {
    prefetch: {
      views: [{ address: { url: req.headers.host + req.originalUrl } }]
    }
  };

  processTargetRequest(prefetchViewsRequest, req, res);
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

process.on("warning", e => {
  console.warn("Node application warning", e);
  process.exit(-1);
});
