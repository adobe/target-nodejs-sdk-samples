const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const TargetNodeClient = require("@adobe/target-node-client");

const TEMPLATE = fs.readFileSync(`${__dirname}/index.tpl`).toString();
const CONFIG = require("./config.json");

const app = express();
const PORT = 3000;

const targetOptions = Object.assign({ logger: console }, CONFIG);
const targetClient = TargetNodeClient.create(targetOptions);

app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, { maxAge: cookie.maxAge * 1000 });
}

function sendHtml(res, response) {
  const serverState = {
    request: response.request,
    response: response.response
  };

  let result = TEMPLATE.replace(/\$\{organizationId\}/g, CONFIG.organizationId)
    .replace("${clientCode}", CONFIG.client)
    .replace("${visitorState}", JSON.stringify(response.visitorState))
    .replace("${serverState}", JSON.stringify(serverState, null, " "));

  if (CONFIG.serverDomain) {
    result = result.replace("${serverDomain}", CONFIG.serverDomain);
  } else {
    result = result.replace('serverDomain: "${serverDomain}"', "");
  }

  res.status(200).send(result);
}

function sendErrorHtml(res) {
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

function sendResponse(res, response) {
  res.set({ "Content-Type": "text/html" });

  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);
  sendHtml(res, response);
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

function processTargetRequest(request, req, res) {
  request.trace = setTraceToken(request.trace, req);
  const options = Object.assign({ request }, getCommonTargetOptions(req));

  targetClient
    .getOffers(options)
    .then(resp => {
      sendResponse(res, resp);
    })
    .catch(error => {
      console.error("AT: ", error);
      sendErrorResponse(res);
    });
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
