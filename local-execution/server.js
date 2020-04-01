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
const Handlebars = require('handlebars');
const TargetClient = require("@adobe/target-nodejs-sdk");

// Load the template of the HTML page returned in the response
const TEMPLATE = fs.readFileSync(`${__dirname}/index.handlebars`).toString();
const handlebarsTemplate = Handlebars.compile(TEMPLATE);
const responseVars = {
  pageTitle: "Target Local Demo"
};

const CONFIG = {
  client: "adobesummit2018",
  organizationId: "65453EA95A70434F0A495D34@AdobeOrg",
  executionMode: "local",
  artifactLocation: "https://assets.staging.adobetarget.com/adobesummit2018/waters_test/demo.json",
  clientReadyCallback: targetReady
};

const targetClient = TargetClient.create(CONFIG);

const app = express();
app.use(cookieParser());

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

function sendHtml(res, offer) {
  const htmlResponse = handlebarsTemplate({
    ...responseVars,
    targetResponse: JSON.stringify(offer, null, 4),
  });

  res.status(200).send(htmlResponse);
}

function sendSuccessResponse(res, response) {
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  sendHtml(res, response);
}

function sendErrorResponse(res, error) {
  res.set(getResponseHeaders());
  const htmlResponse = handlebarsTemplate({
    ...responseVars,
    error: true,
    targetResponse: JSON.stringify({
      message: `ERROR: ${error.message}`
    }, null, 4),
  });

  res.status(200).send(htmlResponse);
}

function getAddress(req) {
  return {url: req.headers.host + req.originalUrl}
}

function targetReady() {
  app.get("/", async (req, res) => {
    const targetCookie = req.cookies[TargetClient.TargetCookieName];
    const request = {
      context: {
        "userAgent": req.get("user-agent"),
        "channel": "web",
        "browser": {"host": req.get("host")},
      },
      execute: {
        mboxes: [{
          address: getAddress(req),
          name: "kitty"
        },
          {
            address: getAddress(req),
            name: "browser-mbox"
          }]
      }
    };

    try {
      const response = await targetClient.getOffers({request, targetCookie});
      sendSuccessResponse(res, response);
    } catch (error) {
      console.error("Target:", error);
      sendErrorResponse(res, error);
    }
  });

  app.listen(3000, function () {
    console.log("Listening on port 3000 and watching!");
  });
}
