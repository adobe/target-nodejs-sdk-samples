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

const _ = require("lodash");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const Handlebars = require("handlebars");
const TargetClient = require("@adobe/target-nodejs-sdk");

const PAGE_TITLE = "Target Local Sample";
// Load the template of the HTML page returned in the response
const TEMPLATE = fs.readFileSync(`${__dirname}/index.handlebars`).toString();
const handlebarsTemplate = Handlebars.compile(TEMPLATE);

const app = express();
app.use(express.static("public"));
app.use(cookieParser());

const RESPONSE_HEADERS = {
  "Content-Type": "text/html",
  Expires: new Date().toUTCString(),
};

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, { maxAge: cookie.maxAge * 1000 });
}

function sendHtml(res, pageContext) {
  const html = handlebarsTemplate({
    pageTitle: PAGE_TITLE,
    ...pageContext,
  });

  res.status(200).send(html);
}

function sendSuccessResponse(res, targetResponse) {
  res.set(RESPONSE_HEADERS);
  saveCookie(res, targetResponse.targetCookie);

  const offer = _.get(
    targetResponse,
    "response.execute.mboxes[0].options[0].content"
  );

  sendHtml(res, {
    targetResponse: JSON.stringify(targetResponse, null, 4),
    offer,
  });
}

function sendErrorResponse(res, error) {
  res.set(RESPONSE_HEADERS);
  sendHtml(res, {
    error: true,
    targetResponse: `ERROR: ${error.message}`,
  });
}

const CONFIG = {
  client: "adobesummit2018",
  organizationId: "65453EA95A70434F0A495D34@AdobeOrg",
  executionMode: "local",
  artifactPayload: require("./sampleRules"),
  events: {
    clientReady:startExpressApp
  },
};

const targetClient = TargetClient.create(CONFIG);

function startExpressApp() {
  app.get("/", async (req, res) => {
    const targetCookie = req.cookies[TargetClient.TargetCookieName];
    const request = {
      context: {
        userAgent: req.get("user-agent"),
        channel: "web",
        browser: { host: req.get("host") },
      },
      execute: {
        mboxes: [{ name: "demo-marketing-offer1" }],
      },
    };

    try {
      const response = await targetClient.getOffers({
        request,
        targetCookie,
      });
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
