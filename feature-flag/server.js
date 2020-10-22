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
const { getSearchProvider } = require("./provider");

const PAGE_TITLE = "Target On-Device Decisioning Sample";
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
    ...pageContext,
    pageTitle: PAGE_TITLE,
  });

  res.status(200).send(html);
}

function sendSuccessResponse(res, targetResponse, pageContext = {}) {
  res.set(RESPONSE_HEADERS);
  saveCookie(res, targetResponse.targetCookie);

  sendHtml(res, {
    ...pageContext,
    targetResponse: JSON.stringify(targetResponse, null, 4),
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
  decisioningMethod: "on-device",
  artifactPayload: require("./sampleRules"),
  events: {
    clientReady: startExpressApp
  },
};

const targetClient = TargetClient.create(CONFIG);

async function startExpressApp() {
  app.get("/", async (req, res) => {
    const targetCookie = req.cookies[TargetClient.TargetCookieName];
    try {
      const offerAttributes = await targetClient.getAttributes(
        ["demo-engineering-flags", "demo-marketing-offer1"],
        { targetCookie }
      );

      const searchProviderId = offerAttributes.getValue(
        "demo-engineering-flags",
        "searchProviderId"
      );

      const searchProvider = getSearchProvider(searchProviderId);

      let searchResult;

      if (req.query.search) {
        searchResult = await searchProvider.execute(req.query.search);
      }

      sendSuccessResponse(res, offerAttributes.getResponse(), {
        search: {
          domain: searchProvider.domain,
          result: searchResult,
        },
        flags: JSON.stringify(offerAttributes.asObject(), null, 4),
        offer: offerAttributes.asObject("demo-marketing-offer1"),
      });
    } catch (error) {
      console.error("Target:", error);
      sendErrorResponse(res, error);
    }
  });

  app.listen(3000, function () {
    console.log("Listening on port 3000 and watching!");
  });
}
