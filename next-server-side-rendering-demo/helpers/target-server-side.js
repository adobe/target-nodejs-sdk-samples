import { parseCookies, setCookie } from "nookies";
import TargetClient from "@adobe/target-nodejs-sdk";
import CONFIG from "./target-config.json";

const targetOptions = Object.assign({ logger: console }, CONFIG);
const targetClient = TargetClient.create(targetOptions);

function saveCookie(ctx, cookie) {
  if (!cookie) {
    return;
  }

  setCookie(ctx, cookie.name, cookie.value, { maxAge: cookie.maxAge * 1000 });
}

function getTargetOptions(ctx) {
  const cookies = parseCookies(ctx);

  return {
    targetCookie:
      cookies[encodeURIComponent(TargetClient.TargetCookieName)],
    targetLocationHintCookie:
      cookies[
        encodeURIComponent(TargetClient.TargetLocationHintCookieName)
      ]
  };
}

function setTraceToken(request = {}, ctx) {
  const { trace={} } = request;
  const { authorizationToken = ctx.query.authorization } = trace;

  if (!authorizationToken || typeof authorizationToken !== "string") {
    return request;
  }

  return {
    ...request,
    trace: {
      ...trace,
      authorizationToken
    }
  }
}

function setResponseCookies(ctx, response) {
  saveCookie(ctx, response.targetCookie);
  saveCookie(ctx, response.targetLocationHintCookie);
}

async function prefetchOffers(ctx) {
  const { req } = ctx;
  if (!req) {
    return {};
  }
  const requestURL = ctx.req.headers.host + ctx.asPath;
  let prefetchViewsRequest = {
    prefetch: {
      views: [{ address: { url: requestURL } }]
    }
  };

  prefetchViewsRequest = setTraceToken(prefetchViewsRequest, ctx);

  const options = Object.assign(
    { request: prefetchViewsRequest },
    getTargetOptions(ctx)
  );

  const { organizationId, client, serverDomain = "" } = CONFIG;
  const result = {
    organizationId,
    client,
    serverDomain
  };

  try {
    const response = await targetClient.getOffers(options);
    setResponseCookies(ctx, response);
    result.visitorState = JSON.stringify(response.visitorState);
    result.serverState = {
      request: response.request,
      response: response.response
    };
  } catch (e) {
    console.error("Target: Error prefetching offers: ", e);
  }

  return result;
}

function visitorInit(props) {
  return `Visitor.getInstance("${
    props.target.organizationId
  }", {serverState: ${JSON.stringify(props.target.visitorState || {})}});`;
}

function targetInit(props) {
  return `window.targetGlobalSettings = {
    overrideMboxEdgeServer: true,
    clientCode: "${props.target.client}",
    imsOrgId: "${props.target.organizationId}",
    serverDomain: "${props.target.serverDomain}",
    serverState: ${JSON.stringify(props.target.serverState || {}, null, " ")}
  };`;
}

function analyticsBeacon() {
  return "var s_code=s.t();if(s_code)document.write(s_code);";
}

export default {
  prefetchOffers,
  visitorInit,
  targetInit,
  analyticsBeacon
};
