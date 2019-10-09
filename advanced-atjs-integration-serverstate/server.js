/***************************************************************************************
 * (c) 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
// const TargetClient = require("@adobe/target-nodejs-sdk");
const TargetClient = require("./tmp-node-client/index"); // Temp fix until NodeJS SDK is public
const CONFIG = {
  client: "adobetargetmobile",
  organizationId: "B8A054D958807F770A495DD6@AdobeOrg",
  timeout: 10000,
  logger: console
};
const targetClient = TargetClient.create(CONFIG);
const TEMPLATE = fs.readFileSync(__dirname + "/templates/index.tpl").toString();

const app = express();
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
}

const getResponseHeaders = () => ({
  "Content-Type": "text/html",
  "Expires": new Date().toUTCString()
});

function sendHtml(res, targetResponse) {
  const serverState = {
    request: targetResponse.request,
    response: targetResponse.response
  };
  const htmlResponse = TEMPLATE
    .replace("${organizationId}", CONFIG.organizationId)
    .replace("${visitorState}", JSON.stringify(targetResponse.visitorState))
    .replace("${serverState}", JSON.stringify(serverState, null, ' '))
    .replace("${content}", JSON.stringify(targetResponse, null, ' '));

  res.status(200).send(htmlResponse);
}

function sendSuccessResponse(res, response) {
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);
  sendHtml(res, response);
}

function sendErrorResponse(res, error) {
  res.set(getResponseHeaders());
  res.status(500).send(error);
}

function getAddress(req) {
  return { url: req.headers.host + req.originalUrl }
}

app.get("/", async (req, res) => {
  const visitorCookie = req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie = req.cookies[TargetClient.TargetLocationHintCookieName];
  const request = {
    execute: {
      mboxes: [{
        address: getAddress(req),
        name: "a1-serverside-ab"
      }]
    }};

  try {
    const response = await targetClient.getOffers({ request, visitorCookie, targetCookie, targetLocationHintCookie });
    sendSuccessResponse(res, response);
  } catch (error) {
    console.error("Target:", error);
    sendErrorResponse(res, error);
  }
});

app.listen(3000, function () {
  console.log("Listening on port 3000 and watching!");
});
