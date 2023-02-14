// proxy example for Node 18.2+ users
const TargetClient = require("@adobe/target-nodejs-sdk");
const { ProxyAgent } = require("undici");

let client;

const context = {
  channel: "web",
  address: {
    url: "http://local-target-test"
  },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:73.0) Gecko/20100101 Firefox/73.0"
};

const visitorId = {
  tntId: "338e3c1e51f7416a8e1ccba4f81acea0.28_0",
  marketingCloudVisitorId: "07327024324407615852294135870030620007"
};

const targetRequest = {
  id: visitorId,
  context
};

function getOffers() {
  client
    .getOffers({
      request: {
        ...targetRequest,
        prefetch: {
          mboxes: [
            {
              name: "jason-flags",
              index: 1
            }
          ]
        }
      },
      sessionId: "dummy_session"
    })
    .then(res => {
      console.log("Result: Success", JSON.stringify(res, null, 4));
    })
    .catch(err => {
      console.log("ERROR");
      console.log(err.message);
    });
}

const proxyAgent = new ProxyAgent("http://localhost:8080");

const fetchImpl = (url, options) => {
  const fetchOptions = options;
  fetchOptions.dispatcher = proxyAgent;
  // undici fetch
  return fetch(url, fetchOptions);
};

client = TargetClient.create({
  client: "targettesting",
  fetchApi: fetchImpl,
  organizationId: "74F652E95F1B16FE0A495C92@AdobeOrg",
  decisioningMethod: "on-device",
  events: { clientReady: getOffers },
  logger: {
    debug: (...messages) => console.log(...messages),
    error: (...messages) => console.log(...messages)
  }
});
