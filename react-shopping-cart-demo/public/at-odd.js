/**
 * @license
 * at.js 2.6.1 | (c) Adobe Systems Incorporated | All rights reserved
 * zepto.js | (c) 2010-2016 Thomas Fuchs | zeptojs.com/license
*/
window.adobe = window.adobe || {};
window.adobe.target = (function () {
	'use strict';

	// This is used to make RequireJS happy
	var define;
	var _win = window;
	var _doc = document;
	var _isIE11OrModernBrowser = _doc.documentMode ? _doc.documentMode >= 11 : true;
	var _isStandardMode = _doc.compatMode && _doc.compatMode === "CSS1Compat";

	function isIE() {
	  var ua = window.navigator.userAgent;
	  var ie10orOlder = ua.indexOf("MSIE ") > 0;
	  var ie11 = ua.indexOf("Trident/") > 0;

	  return ie10orOlder || ie11;
	}

	var _isEnabled = _isStandardMode && _isIE11OrModernBrowser && !isIE();
	var _globalSettings = _win.targetGlobalSettings;

	if (!_isEnabled || (_globalSettings && _globalSettings.enabled === false)) {
	  _win.adobe = _win.adobe || {};
	  _win.adobe.target = {
	    VERSION: "",
	    event: {},
	    getOffer: noop,
	    getOffers: noopPromise,
	    applyOffer: noop,
	    applyOffers: noopPromise,
	    sendNotifications: noopPromise,
	    trackEvent: noop,
	    triggerView: noop,
	    registerExtension: noop,
	    init: noop
	  };
	  _win.mboxCreate = noop;
	  _win.mboxDefine = noop;
	  _win.mboxUpdate = noop;

	  if ("console" in _win && "warn" in _win.console) {
	    _win.console.warn(
	      "AT: Adobe Target content delivery is disabled. Update your DOCTYPE to support Standards mode."
	    );
	  }

	  return _win.adobe.target;
	}


	const ARTIFACT_DOWNLOAD_SUCCEEDED = "artifactDownloadSucceeded";
	const ARTIFACT_DOWNLOAD_FAILED = "artifactDownloadFailed";
	const GEO_LOCATION_UPDATED = "geoLocationUpdated";

	/*
	object-assign
	(c) Sindre Sorhus
	@license MIT
	*/
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;
	function toObject(val) {
	  if (val === null || val === undefined) {
	    throw new TypeError('Object.assign cannot be called with null or undefined');
	  }
	  return Object(val);
	}
	function shouldUseNative() {
	  try {
	    if (!Object.assign) {
	      return false;
	    }
	    var test1 = new String('abc');
	    test1[5] = 'de';
	    if (Object.getOwnPropertyNames(test1)[0] === '5') {
	      return false;
	    }
	    var test2 = {};
	    for (var i = 0; i < 10; i++) {
	      test2['_' + String.fromCharCode(i)] = i;
	    }
	    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
	      return test2[n];
	    });
	    if (order2.join('') !== '0123456789') {
	      return false;
	    }
	    var test3 = {};
	    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
	      test3[letter] = letter;
	    });
	    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
	      return false;
	    }
	    return true;
	  } catch (err) {
	    return false;
	  }
	}
	var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	  var from;
	  var to = toObject(target);
	  var symbols;
	  for (var s = 1; s < arguments.length; s++) {
	    from = Object(arguments[s]);
	    for (var key in from) {
	      if (hasOwnProperty.call(from, key)) {
	        to[key] = from[key];
	      }
	    }
	    if (getOwnPropertySymbols) {
	      symbols = getOwnPropertySymbols(from);
	      for (var i = 0; i < symbols.length; i++) {
	        if (propIsEnumerable.call(from, symbols[i])) {
	          to[symbols[i]] = from[symbols[i]];
	        }
	      }
	    }
	  }
	  return to;
	};

	var reactorObjectAssign = objectAssign;

	function isNil(value) {
	  return value == null;
	}

	const {
	  isArray
	} = Array;

	const {
	  prototype: objectProto
	} = Object;
	const {
	  toString: nativeObjectToString
	} = objectProto;
	function objectToString(value) {
	  return nativeObjectToString.call(value);
	}
	function baseGetTag(value) {
	  return objectToString(value);
	}

	function isObject(value) {
	  const type = typeof value;
	  const notNull = value != null;
	  return notNull && (type === "object" || type === "function");
	}

	const funcTag = "[object Function]";
	function isFunction(value) {
	  if (!isObject(value)) {
	    return false;
	  }
	  return baseGetTag(value) === funcTag;
	}

	function identity(value) {
	  return value;
	}

	function castFunction(value) {
	  return isFunction(value) ? value : identity;
	}

	function keys(object) {
	  if (isNil(object)) {
	    return [];
	  }
	  return Object.keys(object);
	}

	const arrayEach = (iteratee, collection) => collection.forEach(iteratee);

	const baseEach = (iteratee, collection) => {
	  arrayEach(key => iteratee(collection[key], key), keys(collection));
	};

	const arrayFilter = (predicate, collection) => collection.filter(predicate);
	const baseFilter = (predicate, collection) => {
	  const result = {};
	  baseEach((value, key) => {
	    if (predicate(value, key)) {
	      result[key] = value;
	    }
	  }, collection);
	  return result;
	};
	function filter(predicate, collection) {
	  if (isNil(collection)) {
	    return [];
	  }
	  const func = isArray(collection) ? arrayFilter : baseFilter;
	  return func(castFunction(predicate), collection);
	}

	function first(array) {
	  return array && array.length ? array[0] : undefined;
	}

	function flatten(array) {
	  if (isNil(array)) {
	    return [];
	  }
	  return [].concat.apply([], array);
	}

	function flow(funcs) {
	  const length = funcs ? funcs.length : 0;
	  let index = length;
	  while (index -= 1) {
	    if (!isFunction(funcs[index])) {
	      throw new TypeError("Expected a function");
	    }
	  }
	  return (...args) => {
	    let i = 0;
	    let result = length ? funcs[i].apply(this, args) : args[0];
	    while ((i += 1) < length) {
	      result = funcs[i].call(this, result);
	    }
	    return result;
	  };
	}

	function forEach(iteratee, collection) {
	  if (isNil(collection)) {
	    return;
	  }
	  const func = isArray(collection) ? arrayEach : baseEach;
	  func(castFunction(iteratee), collection);
	}

	function isObjectLike(value) {
	  const notNull = value != null;
	  return notNull && typeof value === "object";
	}

	const stringTag = "[object String]";
	function isString(value) {
	  return typeof value === "string" || !isArray(value) && isObjectLike(value) && baseGetTag(value) === stringTag;
	}

	function hash(string) {
	  if (!isString(string)) {
	    return -1;
	  }
	  let result = 0;
	  const {
	    length
	  } = string;
	  for (let i = 0; i < length; i += 1) {
	    result = (result << 5) - result + string.charCodeAt(i) & 0xffffffff;
	  }
	  return result;
	}

	const MAX_SAFE_INTEGER = 9007199254740991;
	function isLength(value) {
	  return typeof value === "number" && value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER;
	}

	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}

	const arrayMap = (iteratee, collection) => collection.map(iteratee);

	function baseValues(props, object) {
	  return arrayMap(key => object[key], props);
	}
	function copyArray(source) {
	  let index = 0;
	  const {
	    length
	  } = source;
	  const array = Array(length);
	  while (index < length) {
	    array[index] = source[index];
	    index += 1;
	  }
	  return array;
	}
	function stringToArray(str) {
	  return str.split("");
	}
	function toArray(value) {
	  if (isNil(value)) {
	    return [];
	  }
	  if (isArrayLike(value)) {
	    return isString(value) ? stringToArray(value) : copyArray(value);
	  }
	  return baseValues(keys(value), value);
	}

	function includes(value, collection) {
	  const coll = isArrayLike(collection) ? collection : toArray(collection);
	  return coll.indexOf(value) > -1;
	}

	const {
	  prototype: objectProto$1
	} = Object;
	const {
	  hasOwnProperty: hasOwnProperty$1
	} = objectProto$1;
	function isEmpty(value) {
	  if (value == null) {
	    return true;
	  }
	  if (isArrayLike(value) && (isArray(value) || isString(value) || isFunction(value.splice))) {
	    return !value.length;
	  }
	  for (const key in value) {
	    if (hasOwnProperty$1.call(value, key)) {
	      return false;
	    }
	  }
	  return true;
	}

	const {
	  prototype: stringProto
	} = String;
	const {
	  trim: nativeStringTrim
	} = stringProto;
	function trim(string) {
	  return isNil(string) ? "" : nativeStringTrim.call(string);
	}

	function isBlank(value) {
	  return isString(value) ? !trim(value) : isEmpty(value);
	}

	const isNotBlank = value => !isBlank(value);

	const numberTag = "[object Number]";
	function isNumber(value) {
	  return typeof value === "number" || isObjectLike(value) && baseGetTag(value) === numberTag;
	}

	const objectTag = "[object Object]";
	const {
	  prototype: funcProto
	} = Function;
	const {
	  prototype: objectProto$2
	} = Object;
	const {
	  toString: funcToString
	} = funcProto;
	const {
	  hasOwnProperty: hasOwnProperty$2
	} = objectProto$2;
	const objectCtorString = funcToString.call(Object);
	function getPrototype(value) {
	  return Object.getPrototypeOf(Object(value));
	}
	function isPlainObject(value) {
	  if (!isObjectLike(value) || baseGetTag(value) !== objectTag) {
	    return false;
	  }
	  const proto = getPrototype(value);
	  if (proto === null) {
	    return true;
	  }
	  const Ctor = hasOwnProperty$2.call(proto, "constructor") && proto.constructor;
	  return typeof Ctor === "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
	}

	function join(joiner, collection) {
	  if (!isArray(collection)) {
	    return "";
	  }
	  return collection.join(joiner || "");
	}

	const baseMap = (iteratee, collection) => {
	  const result = {};
	  baseEach((value, key) => {
	    result[key] = iteratee(value, key);
	  }, collection);
	  return result;
	};
	function map(iteratee, collection) {
	  if (isNil(collection)) {
	    return [];
	  }
	  const func = isArray(collection) ? arrayMap : baseMap;
	  return func(castFunction(iteratee), collection);
	}

	function now() {
	  return new Date().getTime();
	}

	const arrayReduce = (iteratee, accumulator, collection) => collection.reduce(iteratee, accumulator);
	const baseReduce = (iteratee, accumulator, collection) => {
	  let localAcc = accumulator;
	  baseEach((value, key) => {
	    localAcc = iteratee(localAcc, value, key);
	  }, collection);
	  return localAcc;
	};
	function reduce(iteratee, accumulator, collection) {
	  if (isNil(collection)) {
	    return accumulator;
	  }
	  const func = isArray(collection) ? arrayReduce : baseReduce;
	  return func(castFunction(iteratee), accumulator, collection);
	}

	const {
	  prototype: arrayProto
	} = Array;
	const {
	  reverse: nativeReverse
	} = arrayProto;
	function reverse(array) {
	  return array == null ? array : nativeReverse.call(array);
	}

	function split(separator, string) {
	  if (isBlank(string)) {
	    return [];
	  }
	  return string.split(separator || "");
	}

	function random(lower, upper) {
	  return lower + Math.floor(Math.random() * (upper - lower + 1));
	}
	function uuid() {
	  let d = now();
	  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, c => {
	    const r = (d + random(0, 16)) % 16 | 0;
	    d = Math.floor(d / 16);
	    return (c === "x" ? r : r & 0x3 | 0x8).toString(16);
	  });
	}

	function values(obj) {
	  if (obj === null || typeof obj !== "object") {
	    return [];
	  }
	  return Object.keys(obj).map(key => obj[key]);
	}

	function delay(func, wait = 0) {
	  return setTimeout(func, Number(wait) || 0);
	}
	function cancelDelay(id) {
	  clearTimeout(id);
	}

	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function ownKeys(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread2(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys(Object(source), true).forEach(function (key) {
	        _defineProperty(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	const DECISIONING_METHOD = {
	  ON_DEVICE: "on-device",
	  SERVER_SIDE: "server-side",
	  HYBRID: "hybrid"
	};

	const AT_PREFIX = "AT:";
	const NOOP_LOGGER = {
	  debug(...messages) {},
	  error(...messages) {}
	};
	function getLogger(logger = {}) {
	  if (logger.built) {
	    return logger;
	  }
	  const {
	    debug,
	    error
	  } = logger;
	  const targetLogger = reactorObjectAssign({
	    built: true
	  }, NOOP_LOGGER);
	  if (isFunction(debug)) {
	    targetLogger.debug = (...messages) => {
	      logger.debug.apply(null, [AT_PREFIX, ...messages]);
	    };
	  }
	  if (isFunction(error)) {
	    targetLogger.error = (...messages) => {
	      logger.error.apply(null, [AT_PREFIX, ...messages]);
	    };
	  }
	  return targetLogger;
	}

	const DECISIONING_ENGINE_NOT_READY = "Unable to fulfill request; decisioning engine not ready.";

	const DEFAULT_GLOBAL_MBOX = "target-global-mbox";
	const DEFAULT_NUM_FETCH_RETRIES = 10;
	const ChannelType = {
	  Mobile: "mobile",
	  Web: "web"
	};
	const MetricType = {
	  Click: "click",
	  Display: "display"
	};
	const AuthenticatedState = {
	  Unknown: "unknown",
	  Authenticated: "authenticated",
	  LoggedOut: "logged_out"
	};
	const ENVIRONMENT_PROD = "production";
	const ENVIRONMENT_STAGE = "staging";
	const ENVIRONMENT_DEV = "development";
	const POSSIBLE_ENVIRONMENTS = [ENVIRONMENT_PROD, ENVIRONMENT_STAGE, ENVIRONMENT_DEV];
	const UNKNOWN_IP_ADDRESS = "unknownIpAddress";

	const VIEWS = "views";
	const MBOXES = "mboxes";
	function isUndefined(value) {
	  return typeof value === "undefined";
	}
	function isDefined(value) {
	  return !isUndefined(value);
	}
	function getNamesForRequested(itemsKey, deliveryRequest) {
	  const resultSet = new Set();
	  ["prefetch", "execute"].forEach(type => {
	    const items = deliveryRequest && deliveryRequest[type] && deliveryRequest[type][itemsKey] instanceof Array ? deliveryRequest[type][itemsKey] : [];
	    items.filter(item => isDefined(item.name)).forEach(item => {
	      resultSet.add(item.name);
	    });
	  });
	  return resultSet;
	}
	function getMboxNames(deliveryRequest) {
	  return getNamesForRequested(MBOXES, deliveryRequest);
	}
	function getViewNames(deliveryRequest) {
	  return getNamesForRequested(VIEWS, deliveryRequest);
	}
	function hasRequested(itemsKey, deliveryRequest) {
	  const types = ["prefetch", "execute"];
	  for (let i = 0; i < types.length; i += 1) {
	    const type = types[i];
	    const items = deliveryRequest && deliveryRequest[type] && deliveryRequest[type][itemsKey] instanceof Array ? deliveryRequest[type][itemsKey] : undefined;
	    if (isDefined(items) && items instanceof Array) {
	      return true;
	    }
	  }
	  return false;
	}
	function hasRequestedViews(deliveryRequest) {
	  return hasRequested(VIEWS, deliveryRequest);
	}
	function isBrowser() {
	  return typeof window !== "undefined";
	}
	function isNodeJS() {
	  return typeof global !== "undefined";
	}
	const noop = () => undefined;
	const noopPromise = value => Promise.resolve(value);
	function requiresDecisioningEngine(decisioningMethod) {
	  return includes(decisioningMethod, [DECISIONING_METHOD.ON_DEVICE, DECISIONING_METHOD.HYBRID]);
	}
	function objectWithoutUndefinedValues(obj) {
	  const result = _objectSpread2({}, obj);
	  Object.keys(result).forEach(key => {
	    if (isUndefined(result[key])) {
	      delete result[key];
	    }
	  });
	  return result;
	}
	function getPropertyToken(property = {
	  token: undefined
	}) {
	  const {
	    token = undefined
	  } = property;
	  return token;
	}
	function isValidIpAddress(ipAddress) {
	  const IP_ADDRESS = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/g;
	  return isString(ipAddress) && IP_ADDRESS.test(ipAddress);
	}
	function memoize(func, keyResolverFunc = arr => arr[0]) {
	  const memoizedValues = {};
	  return function memoized(...funcArgs) {
	    const key = keyResolverFunc.call(this, funcArgs);
	    if (!isDefined(memoizedValues[key])) {
	      memoizedValues[key] = func.call(null, ...funcArgs);
	    }
	    return memoizedValues[key];
	  };
	}

	const NOT_MODIFIED = 304;
	function getFetchApi(fetchApi) {
	  if (isFunction(fetchApi)) {
	    return fetchApi;
	  }
	  let api;
	  if (isNodeJS() && typeof global.fetch === "function") {
	    api = global.fetch;
	  } else if (isBrowser() &&
	  typeof window.fetch === "function") {
	    api = window.fetch.bind(window);
	  }
	  return api;
	}
	function getFetchWithRetry(fetchApi, maxRetries = DEFAULT_NUM_FETCH_RETRIES, errorFunc = errorMessage => errorMessage, incidentalFailureCallback = noop) {
	  return function fetchWithRetry(url, options, numRetries = maxRetries) {
	    return fetchApi(url, options).then(res => {
	      if (!res.ok && res.status !== NOT_MODIFIED) {
	        throw Error(res.statusText);
	      }
	      return res;
	    })['catch'](err => {
	      if (isFunction(incidentalFailureCallback)) {
	        incidentalFailureCallback.call(undefined, err);
	      }
	      if (numRetries < 1) {
	        throw new Error(errorFunc(err.message));
	      }
	      return fetchWithRetry(url, options, numRetries - 1);
	    });
	  };
	}

	function matchUserAgent(matchersList, processFunc) {
	  processFunc = typeof processFunc === "function" ? processFunc : matcher => matcher.name;
	  return function checkMatches(userAgent) {
	    for (let i = 0; i < matchersList.length; i += 1) {
	      const matcher = matchersList[i];
	      const matches = userAgent.match(matcher.regex);
	      if (matches) {
	        return processFunc(matcher, matches);
	      }
	    }
	    return processFunc({
	      name: "Unknown"
	    });
	  };
	}
	const browserFromUserAgent = (userAgent = "") => matchUserAgent([{
	  name: "Edge",
	  regex: /(edge|edgios|edga|edg)\/((\d+)?[\w.]+)/i,
	  versionGroupIndex: 2
	}, {
	  name: "Mobile Safari",
	  regex: /version\/([\w.]+).+?mobile\/\w+\s(safari)/i,
	  versionGroupIndex: 1
	}, {
	  name: "Safari",
	  regex: /version\/([\w.]+).+?(mobile\s?safari|safari)/i,
	  versionGroupIndex: 1
	}, {
	  name: "Chrome",
	  regex: /(chrome)\/v?([\w.]+)/i,
	  versionGroupIndex: 2
	}, {
	  name: "Firefox",
	  regex: /(firefox)\/([\w.-]+)$/i,
	  versionGroupIndex: 2
	}, {
	  name: "IE",
	  regex: /(?:ms|\()(ie)\s([\w.]+)/i,
	  versionGroupIndex: 2
	}, {
	  name: "IE",
	  regex: /(trident).+rv[:\s]([\w.]+).+like\sgecko/i,
	  versionGroupIndex: 2,
	  version: 11
	}], (matcher, matches) => {
	  const version = (matches && matches.length > matcher.versionGroupIndex ? matches[matcher.versionGroupIndex] : matcher.version) || "-1";
	  const majorVersion = typeof version === "string" ? parseInt(version.split(".")[0], 10) : -1;
	  return {
	    name: matcher.name,
	    version: majorVersion
	  };
	})(userAgent);
	const operatingSystemFromUserAgent = userAgent => matchUserAgent([{
	  name: "iOS",
	  regex: /iPhone|iPad|iPod/
	}, {
	  name: "Android",
	  regex: /Android [0-9.]+;/
	}, {
	  name: "Linux",
	  regex: / Linux /
	}, {
	  name: "Unix",
	  regex: /FreeBSD|OpenBSD|CrOS/
	}, {
	  name: "Windows",
	  regex: /[( ]Windows /
	}, {
	  name: "Mac OS",
	  regex: /Macintosh;/
	}])(userAgent);

	function mul32(m, n) {
	  const nlo = n & 0xffff;
	  const nhi = n - nlo;
	  return (nhi * m | 0) + (nlo * m | 0) | 0;
	}
	function hashUnencodedCharsRaw(stringValue, seed = 0) {
	  let k1;
	  const len = stringValue.length;
	  const c1 = 0xcc9e2d51;
	  const c2 = 0x1b873593;
	  let h1 = seed;
	  const roundedEnd = len & ~0x1;
	  for (let i = 0; i < roundedEnd; i += 2) {
	    k1 = stringValue.charCodeAt(i) | stringValue.charCodeAt(i + 1) << 16;
	    k1 = mul32(k1, c1);
	    k1 = (k1 & 0x1ffff) << 15 | k1 >>> 17;
	    k1 = mul32(k1, c2);
	    h1 ^= k1;
	    h1 = (h1 & 0x7ffff) << 13 | h1 >>> 19;
	    h1 = h1 * 5 + 0xe6546b64 | 0;
	  }
	  if (len % 2 === 1) {
	    k1 = stringValue.charCodeAt(roundedEnd);
	    k1 = mul32(k1, c1);
	    k1 = (k1 & 0x1ffff) << 15 | k1 >>> 17;
	    k1 = mul32(k1, c2);
	    h1 ^= k1;
	  }
	  h1 ^= len << 1;
	  h1 ^= h1 >>> 16;
	  h1 = mul32(h1, 0x85ebca6b);
	  h1 ^= h1 >>> 13;
	  h1 = mul32(h1, 0xc2b2ae35);
	  h1 ^= h1 >>> 16;
	  return h1;
	}
	const hashUnencodedChars = memoize(hashUnencodedCharsRaw, arr => arr.join("-"));

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	function getCjsExportFromNamespace (n) {
		return n && n['default'] || n;
	}

	var performanceNow = createCommonjsModule(function (module) {
	  (function () {
	    var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;
	    if (typeof performance !== "undefined" && performance !== null && performance.now) {
	      module.exports = function () {
	        return performance.now();
	      };
	    } else if (typeof process !== "undefined" && process !== null && process.hrtime) {
	      module.exports = function () {
	        return (getNanoSeconds() - nodeLoadTime) / 1e6;
	      };
	      hrtime = process.hrtime;
	      getNanoSeconds = function () {
	        var hr;
	        hr = hrtime();
	        return hr[0] * 1e9 + hr[1];
	      };
	      moduleLoadTime = getNanoSeconds();
	      upTime = process.uptime() * 1e9;
	      nodeLoadTime = moduleLoadTime - upTime;
	    } else if (Date.now) {
	      module.exports = function () {
	        return Date.now() - loadTime;
	      };
	      loadTime = Date.now();
	    } else {
	      module.exports = function () {
	        return new Date().getTime() - loadTime;
	      };
	      loadTime = new Date().getTime();
	    }
	  }).call(commonjsGlobal);
	});

	function createPerfToolInstance() {
	  let timingIds = {};
	  let startTimes = {};
	  let timings = {};
	  function getUniqueTimingId(id) {
	    const count = (isDefined(timingIds[id]) ? timingIds[id] : 0) + 1;
	    timingIds[id] = count;
	    return "" + id + count;
	  }
	  function timeStart(id, incrementTimer = false) {
	    const timingId = incrementTimer ? getUniqueTimingId(id) : id;
	    if (isUndefined(startTimes[timingId])) {
	      startTimes[timingId] = performanceNow();
	    }
	    return timingId;
	  }
	  function timeEnd(id, offset = 0) {
	    if (isUndefined(startTimes[id])) {
	      return -1;
	    }
	    const timing = performanceNow() - startTimes[id] - offset;
	    timings[id] = timing;
	    return timing;
	  }
	  function reset() {
	    timingIds = {};
	    startTimes = {};
	    timings = {};
	  }
	  return {
	    timeStart,
	    timeEnd,
	    getTimings: () => timings,
	    getTiming: key => timings[key],
	    reset
	  };
	}
	const perfTool = createPerfToolInstance();

	function parseURI(str, opts) {
	  if (!str) return undefined;
	  opts = opts || {};
	  var o = {
	    key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
	    q: {
	      name: 'queryKey',
	      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	    },
	    parser: {
	      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	    }
	  };
	  var m = o.parser[opts.strictMode ? 'strict' : 'loose'].exec(str);
	  var uri = {};
	  var i = 14;
	  while (i--) uri[o.key[i]] = m[i] || '';
	  uri[o.q.name] = {};
	  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
	    if ($1) uri[o.q.name][$1] = $2;
	  });
	  return uri;
	}
	var parseUri = parseURI;

	const TYPE = "type";
	const CONTENT = "content";
	const HEIGHT = "height";
	const WIDTH = "width";
	const LEFT = "left";
	const TOP = "top";
	const FROM = "from";
	const TO = "to";
	const PRIORITY = "priority";
	const SELECTOR = "selector";
	const CSS_SELECTOR = "cssSelector";
	const SET_HTML = "setHtml";
	const SET_CONTENT = "setContent";
	const SET_TEXT = "setText";
	const SET_JSON = "setJson";
	const SET_ATTRIBUTE = "setAttribute";
	const SET_IMAGE_SOURCE = "setImageSource";
	const SET_STYLE = "setStyle";
	const REARRANGE = "rearrange";
	const RESIZE = "resize";
	const MOVE = "move";
	const REMOVE = "remove";
	const CUSTOM_CODE = "customCode";
	const REDIRECT = "redirect";
	const TRACK_CLICK = "trackClick";
	const SIGNAL_CLICK = "signalClick";
	const INSERT_BEFORE = "insertBefore";
	const INSERT_AFTER = "insertAfter";
	const APPEND_HTML = "appendHtml";
	const APPEND_CONTENT = "appendContent";
	const PREPEND_HTML = "prependHtml";
	const PREPEND_CONTENT = "prependContent";
	const REPLACE_HTML = "replaceHtml";
	const REPLACE_CONTENT = "replaceContent";
	const DEBUG = "mboxDebug";
	const DISABLE = "mboxDisable";
	const AUTHORING = "mboxEdit";
	const CHECK = "at_check";
	const TRUE = "true";
	const MBOX_LENGTH = 250;
	const DATA_SRC = "data-at-src";
	const JSON$1 = "json";
	const HTML = "html";
	const DYNAMIC = "dynamic";
	const SCRIPT = "script";
	const SRC = "src";
	const ID = "id";
	const CLASS = "class";
	const CLICK = "click";
	const HEAD_TAG = "head";
	const SCRIPT_TAG = "script";
	const STYLE_TAG = "style";
	const LINK_TAG = "link";
	const IMAGE_TAG = "img";
	const DIV_TAG = "div";
	const NO_CACHED_ARTIFACT = "No cached artifact available for Hybrid mode.";
	const DELIVERY_DISABLED = 'Adobe Target content delivery is disabled. Ensure that you can save cookies to your current domain, there is no "mboxDisable" cookie and there is no "mboxDisable" parameter in query string.';
	const ALREADY_INITIALIZED = "Adobe Target has already been initialized.";
	const OPTIONS_REQUIRED = "options argument is required";
	const REQUEST_REQUIRED = "request option is required";
	const RESPONE_REQUIRED = "response option is required";
	const EXECUTE_OR_PREFETCH_REQUIRED = "execute or prefetch is required";
	const EXECUTE_OR_PREFETCH_NOT_ALLOWED = "execute or prefetch is not allowed";
	const NOTIFICATIONS_REQUIRED = "notifications are required";
	const MBOX_REQUIRED = "mbox option is required";
	const MBOX_TOO_LONG = "mbox option is too long";
	const SUCCESS_REQUIRED = "success option is required";
	const ERROR_REQUIRED = "error option is required";
	const OFFER_REQUIRED = "offer option is required";
	const UNEXPECTED_ERROR = "Unexpected error";
	const REQUEST_FAILED = "request failed";
	const REQUEST_SUCCEEDED = "request succeeded";
	const ACTION_RENDERED = "Action rendered successfully";
	const ACTION_RENDERING = "Rendering action";
	const EMPTY_CONTENT = "Action has no content";
	const EMPTY_ATTRIBUTE = "Action has no attributes";
	const EMPTY_PROPERTY = "Action has no CSS properties";
	const EMPTY_SIZES = "Action has no height or width";
	const EMPTY_COORDINATES = "Action has no left, top or position";
	const EMPTY_REARRANGE = "Action has no from or to";
	const EMPTY_URL = "Action has no url";
	const EMPTY_IMAGE_URL = "Action has no image url";
	const REARRANGE_MISSING = "Rearrange elements are missing";
	const REARRANGE_INCORRECT_INDEXES = "Rearrange has incorrect \"from\" and \"to\" indexes";
	const LOADING_IMAGE = "Loading image";
	const TRACK_EVENT_SUCCESS = "Track event request succeeded";
	const TRACK_EVENT_ERROR = "Track event request failed";
	const NO_ACTIONS = "No actions to be rendered";
	const REDIRECT_ACTION = "Redirect action";
	const REMOTE_SCRIPT = "Script load";
	const ERROR = "error";
	const WARNING = "warning";
	const UNKNOWN = "unknown";
	const VALID = "valid";
	const SUCCESS = "success";
	const RENDER = "render";
	const METRIC = "metric";
	const MBOX = "mbox";
	const OFFER = "offer";
	const NAME = "name";
	const STATUS = "status";
	const PARAMS = "params";
	const ACTIONS = "actions";
	const RESPONSE_TOKENS = "responseTokens";
	const DATA = "data";
	const RESPONSE = "response";
	const REQUEST = "request";
	const PROVIDER = "provider";
	const PAGE_LOAD = "pageLoad";
	const FLICKER_CONTROL_CLASS = "at-flicker-control";
	const MARKER_CSS_CLASS = "at-element-marker";
	const CLICK_TRACKING_CSS_CLASS = "at-element-click-tracking";
	const ENABLED = "enabled";
	const CLIENT_CODE = "clientCode";
	const IMS_ORG_ID = "imsOrgId";
	const SERVER_DOMAIN = "serverDomain";
	const TIMEOUT = "timeout";
	const GLOBAL_MBOX_NAME = "globalMboxName";
	const GLOBAL_MBOX_AUTO_CREATE = "globalMboxAutoCreate";
	const VERSION = "version";
	const DEFAULT_CONTENT_HIDDEN_STYLE = "defaultContentHiddenStyle";
	const DEFAULT_CONTENT_VISIBLE_STYLE = "defaultContentVisibleStyle";
	const BODY_HIDDEN_STYLE = "bodyHiddenStyle";
	const BODY_HIDING_ENABLED = "bodyHidingEnabled";
	const DEVICE_ID_LIFETIME = "deviceIdLifetime";
	const SESSION_ID_LIFETIME = "sessionIdLifetime";
	const SELECTORS_POLLING_TIMEOUT = "selectorsPollingTimeout";
	const VISITOR_API_TIMEOUT = "visitorApiTimeout";
	const OVERRIDE_MBOX_EDGE_SERVER = "overrideMboxEdgeServer";
	const OVERRIDE_MBOX_EDGE_SERVER_TIMEOUT = "overrideMboxEdgeServerTimeout";
	const OPTOUT_ENABLED = "optoutEnabled";
	const SECURE_ONLY = "secureOnly";
	const SUPPLEMENTAL_DATA_ID_PARAM_TIMEOUT = "supplementalDataIdParamTimeout";
	const AUTHORING_SCRIPT_URL = "authoringScriptUrl";
	const SCHEME = "scheme";
	const COOKIE_DOMAIN = "cookieDomain";
	const MBOX_PARAMS = "mboxParams";
	const GLOBAL_MBOX_PARAMS = "globalMboxParams";
	const URL_SIZE_LIMIT = "urlSizeLimit";
	const SESSION_ID_PARAM = "mboxSession";
	const DEVICE_ID_COOKIE = "PC";
	const EDGE_CLUSTER_COOKIE = "mboxEdgeCluster";
	const SESSION_ID_COOKIE = "session";
	const GEO_COOKIE = "at_geo";
	const TRACES_SUFFIX = "Traces";
	const SETTINGS = "settings";
	const CLIENT_TRACES = "client" + TRACES_SUFFIX;
	const SERVER_TRACES = "server" + TRACES_SUFFIX;
	const TRACES = "___target_traces";
	const GLOBAL_SETTINGS = "targetGlobalSettings";
	const DATA_PROVIDER = "dataProvider";
	const DATA_PROVIDERS = DATA_PROVIDER + "s";
	const ENDPOINT = "endpoint";
	const VIEWS_ENABLED = "viewsEnabled";
	const PAGE_LOAD_ENABLED = "pageLoadEnabled";
	const AUTH_STATE = "authState";
	const AUTHENTICATED_STATE = "authenticatedState";
	const INTEGRATION_CODE = "integrationCode";
	const PRIMARY = "primary";
	const PAGE = "page";
	const VIEW = "view";
	const VIEWS$1 = "views";
	const OPTIONS = "options";
	const METRICS = "metrics";
	const EVENT_TOKEN = "eventToken";
	const VIEW_NAME = "viewName";
	const DISPLAY_EVENT = "display";
	const CONTENT_TYPE = "Content-Type";
	const TEXT_PLAIN = "text/plain";
	const RENDERING_VIEW_FAILED = "View rendering failed";
	const VIEW_DELIVERY_ERROR = "View delivery error";
	const VIEW_NAME_ERROR = "View name should be a non-empty string";
	const VIEWS_DISABLED = "Views are not enabled";
	const PAGE_LOAD_DISABLED = "Page load disabled";
	const USING_SERVER_STATE = "Using server state";
	const ADOBE = "adobe";
	const OPTIN = "optIn";
	const IS_APPROVED = "isApproved";
	const FETCH_PERMISSIONS = "fetchPermissions";
	const CATEGORIES = "Categories";
	const TARGET = "TARGET";
	const ANALYTICS = "ANALYTICS";
	const OPTIN_ENABLED = "optinEnabled";
	const ERROR_TARGET_NOT_OPTED_IN = "Adobe Target is not opted in";
	const ANALYTICS_LOGGING = "analyticsLogging";
	const SERVER_STATE = "serverState";
	const CSP_SCRIPT_NONCE = "cspScriptNonce";
	const CSP_STYLE_NONCE = "cspStyleNonce";
	const CACHE_UPDATED_EVENT = "cache-updated-event";
	const NO_OFFERS_EVENT = "no-offers-event";
	const REDIRECT_OFFER_EVENT = "redirect-offer-event";
	const SAMESITE_NONE = "None";
	const DECISIONING_METHOD_SETTING = "decisioningMethod";
	const POLLING_INTERVAL_SETTING = "pollingInterval";
	const ARTIFACT_LOCATION_SETTING = "artifactLocation";
	const ARTIFACT_FORMAT_SETTING = "artifactFormat";
	const ARTIFACT_PAYLOAD_SETTING = "artifactPayload";
	const TARGET_ENVIRONMENT_SETTING = "environment";
	const CDN_ENVIRONMENT_SETTING = "cdnEnvironment";
	const TELEMETRY_ENABLED_SETTING = "telemetryEnabled";
	const CDN_BASEPATH_SETTING = "cdnBasePath";
	const WEB_CHANNEL = "web";

	const FILE_PROTOCOL = "file:";
	const IP_V4_REGEX = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;
	const STANDARD_DOMAIN_REGEX = /^(com|edu|gov|net|mil|org|nom|co|name|info|biz)$/i;
	let config = {};
	const OVERRIDABLE_SETTINGS = [ENABLED, CLIENT_CODE, IMS_ORG_ID, SERVER_DOMAIN, COOKIE_DOMAIN, TIMEOUT, MBOX_PARAMS, GLOBAL_MBOX_PARAMS, DEFAULT_CONTENT_HIDDEN_STYLE, DEFAULT_CONTENT_VISIBLE_STYLE, DEVICE_ID_LIFETIME, BODY_HIDDEN_STYLE, BODY_HIDING_ENABLED, SELECTORS_POLLING_TIMEOUT, VISITOR_API_TIMEOUT, OVERRIDE_MBOX_EDGE_SERVER, OVERRIDE_MBOX_EDGE_SERVER_TIMEOUT, OPTOUT_ENABLED, OPTIN_ENABLED, SECURE_ONLY, SUPPLEMENTAL_DATA_ID_PARAM_TIMEOUT, AUTHORING_SCRIPT_URL, URL_SIZE_LIMIT, ENDPOINT, PAGE_LOAD_ENABLED, VIEWS_ENABLED, ANALYTICS_LOGGING, SERVER_STATE, DECISIONING_METHOD_SETTING, POLLING_INTERVAL_SETTING, ARTIFACT_LOCATION_SETTING, ARTIFACT_FORMAT_SETTING, ARTIFACT_PAYLOAD_SETTING, TARGET_ENVIRONMENT_SETTING, CDN_ENVIRONMENT_SETTING, TELEMETRY_ENABLED_SETTING, CDN_BASEPATH_SETTING, CSP_SCRIPT_NONCE, CSP_STYLE_NONCE, GLOBAL_MBOX_NAME];
	function overrideSettingsIfRequired(settings, globalSettings) {
	  if (!settings[ENABLED]) {
	    return;
	  }
	  if (!isNil(globalSettings[GLOBAL_MBOX_AUTO_CREATE])) {
	    settings[PAGE_LOAD_ENABLED] = globalSettings[GLOBAL_MBOX_AUTO_CREATE];
	  }
	  forEach(field => {
	    if (!isNil(globalSettings[field])) {
	      settings[field] = globalSettings[field];
	    }
	  }, OVERRIDABLE_SETTINGS);
	}
	function isIE10OrModernBrowser(doc) {
	  const {
	    documentMode
	  } = doc;
	  return documentMode ? documentMode >= 10 : true;
	}
	function isStandardMode(doc) {
	  const {
	    compatMode
	  } = doc;
	  return compatMode && compatMode === "CSS1Compat";
	}
	function isIPv4(domain) {
	  return IP_V4_REGEX.test(domain);
	}
	function getCookieDomain(domain) {
	  if (isIPv4(domain)) {
	    return domain;
	  }
	  const parts = reverse(split(".", domain));
	  const len = parts.length;
	  if (len >= 3) {
	    if (STANDARD_DOMAIN_REGEX.test(parts[1])) {
	      return parts[2] + "." + parts[1] + "." + parts[0];
	    }
	  }
	  if (len === 1) {
	    return parts[0];
	  }
	  return parts[1] + "." + parts[0];
	}
	function overrideFromGlobalSettings(win, doc, settings) {
	  const fileProtocol = win.location.protocol === FILE_PROTOCOL;
	  let cookieDomain = "";
	  if (!fileProtocol) {
	    cookieDomain = getCookieDomain(win.location.hostname);
	  }
	  settings[COOKIE_DOMAIN] = cookieDomain;
	  settings[ENABLED] = isStandardMode(doc) && isIE10OrModernBrowser(doc);
	  overrideSettingsIfRequired(settings, win[GLOBAL_SETTINGS] || {});
	}
	function initConfig(settings) {
	  overrideFromGlobalSettings(window, document, settings);
	  const fileProtocol = window.location.protocol === FILE_PROTOCOL;
	  config = reactorObjectAssign({}, settings);
	  config[DEVICE_ID_LIFETIME] = settings[DEVICE_ID_LIFETIME] / 1000;
	  config[SESSION_ID_LIFETIME] = settings[SESSION_ID_LIFETIME] / 1000;
	  config[SCHEME] = config[SECURE_ONLY] || fileProtocol ? "https:" : "";
	}
	function getConfig() {
	  return config;
	}

	var js_cookie = createCommonjsModule(function (module, exports) {
	  (function (factory) {
	    var registeredInModuleLoader;
	    {
	      module.exports = factory();
	      registeredInModuleLoader = true;
	    }
	    if (!registeredInModuleLoader) {
	      var OldCookies = window.Cookies;
	      var api = window.Cookies = factory();
	      api.noConflict = function () {
	        window.Cookies = OldCookies;
	        return api;
	      };
	    }
	  })(function () {
	    function extend() {
	      var i = 0;
	      var result = {};
	      for (; i < arguments.length; i++) {
	        var attributes = arguments[i];
	        for (var key in attributes) {
	          result[key] = attributes[key];
	        }
	      }
	      return result;
	    }
	    function decode(s) {
	      return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
	    }
	    function init(converter) {
	      function api() {}
	      function set(key, value, attributes) {
	        if (typeof document === 'undefined') {
	          return;
	        }
	        attributes = extend({
	          path: '/'
	        }, api.defaults, attributes);
	        if (typeof attributes.expires === 'number') {
	          attributes.expires = new Date(new Date() * 1 + attributes.expires * 864e+5);
	        }
	        attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';
	        try {
	          var result = JSON.stringify(value);
	          if (/^[\{\[]/.test(result)) {
	            value = result;
	          }
	        } catch (e) {}
	        value = converter.write ? converter.write(value, key) : encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
	        key = encodeURIComponent(String(key)).replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent).replace(/[\(\)]/g, escape);
	        var stringifiedAttributes = '';
	        for (var attributeName in attributes) {
	          if (!attributes[attributeName]) {
	            continue;
	          }
	          stringifiedAttributes += '; ' + attributeName;
	          if (attributes[attributeName] === true) {
	            continue;
	          }
	          stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
	        }
	        return document.cookie = key + '=' + value + stringifiedAttributes;
	      }
	      function get(key, json) {
	        if (typeof document === 'undefined') {
	          return;
	        }
	        var jar = {};
	        var cookies = document.cookie ? document.cookie.split('; ') : [];
	        var i = 0;
	        for (; i < cookies.length; i++) {
	          var parts = cookies[i].split('=');
	          var cookie = parts.slice(1).join('=');
	          if (!json && cookie.charAt(0) === '"') {
	            cookie = cookie.slice(1, -1);
	          }
	          try {
	            var name = decode(parts[0]);
	            cookie = (converter.read || converter)(cookie, name) || decode(cookie);
	            if (json) {
	              try {
	                cookie = JSON.parse(cookie);
	              } catch (e) {}
	            }
	            jar[name] = cookie;
	            if (key === name) {
	              break;
	            }
	          } catch (e) {}
	        }
	        return key ? jar[key] : jar;
	      }
	      api.set = set;
	      api.get = function (key) {
	        return get(key, false
	        );
	      };
	      api.getJSON = function (key) {
	        return get(key, true
	        );
	      };
	      api.remove = function (key, attributes) {
	        set(key, '', extend(attributes, {
	          expires: -1
	        }));
	      };
	      api.defaults = {};
	      api.withConverter = init;
	      return api;
	    }
	    return init(function () {});
	  });
	});

	var reactorCookie = {
	  get: js_cookie.get,
	  set: js_cookie.set,
	  remove: js_cookie.remove
	};

	function hasOwnProperty$3(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	var decode = function (qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};
	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }
	  var regexp = /\+/g;
	  qs = qs.split(sep);
	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }
	  var len = qs.length;
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }
	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr,
	        vstr,
	        k,
	        v;
	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }
	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);
	    if (!hasOwnProperty$3(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }
	  return obj;
	};

	var stringifyPrimitive = function (v) {
	  switch (typeof v) {
	    case 'string':
	      return v;
	    case 'boolean':
	      return v ? 'true' : 'false';
	    case 'number':
	      return isFinite(v) ? v : '';
	    default:
	      return '';
	  }
	};
	var encode = function (obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }
	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function (k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function (v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);
	  }
	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
	};

	var querystring = createCommonjsModule(function (module, exports) {
	  exports.decode = exports.parse = decode;
	  exports.encode = exports.stringify = encode;
	});
	var querystring_1 = querystring.decode;
	var querystring_2 = querystring.parse;
	var querystring_3 = querystring.encode;
	var querystring_4 = querystring.stringify;

	var reactorQueryString = {
	  parse: function (string) {
	    if (typeof string === 'string') {
	      string = string.trim().replace(/^[?#&]/, '');
	    }
	    return querystring.parse(string);
	  },
	  stringify: function (object) {
	    return querystring.stringify(object);
	  }
	};

	const {
	  parse,
	  stringify
	} = reactorQueryString;
	const ANCHOR = document.createElement("a");
	const CACHE = {};
	function parseQueryString(value) {
	  try {
	    return parse(value);
	  } catch (e) {
	    return {};
	  }
	}
	function stringifyQueryString(value) {
	  try {
	    return stringify(value);
	  } catch (e) {
	    return "";
	  }
	}
	function decode$1(value) {
	  try {
	    return decodeURIComponent(value);
	  } catch (e) {
	    return value;
	  }
	}
	function encode$1(value) {
	  try {
	    return encodeURIComponent(value);
	  } catch (e) {
	    return value;
	  }
	}
	function parseUri$1(url) {
	  if (CACHE[url]) {
	    return CACHE[url];
	  }
	  ANCHOR.href = url;
	  const parsedUri = parseUri(ANCHOR.href);
	  parsedUri.queryKey = parseQueryString(parsedUri.query);
	  CACHE[url] = parsedUri;
	  return CACHE[url];
	}

	const {
	  get: getCookie,
	  set: setCookie,
	  remove: removeCookie
	} = reactorCookie;
	const MBOX_COOKIE = "mbox";
	function createCookie(name, value, expires) {
	  return {
	    name,
	    value,
	    expires
	  };
	}
	function deserialize(str) {
	  const parts = split("#", str);
	  if (isEmpty(parts) || parts.length < 3) {
	    return null;
	  }
	  if (isNaN(parseInt(parts[2], 10))) {
	    return null;
	  }
	  return createCookie(decode$1(parts[0]), decode$1(parts[1]), Number(parts[2]));
	}
	function getInternalCookies(cookieValue) {
	  if (isBlank(cookieValue)) {
	    return [];
	  }
	  return split("|", cookieValue);
	}
	function readCookies() {
	  const cookies = map(deserialize, getInternalCookies(getCookie(MBOX_COOKIE)));
	  const nowInSeconds = Math.ceil(now() / 1000);
	  const isExpired = val => isObject(val) && nowInSeconds <= val.expires;
	  return reduce((acc, val) => {
	    acc[val.name] = val;
	    return acc;
	  }, {}, filter(isExpired, cookies));
	}

	function getTargetCookie(name) {
	  const cookiesMap = readCookies();
	  const cookie = cookiesMap[name];
	  return isObject(cookie) ? cookie.value : "";
	}
	function serialize(cookie) {
	  return join("#", [encode$1(cookie.name), encode$1(cookie.value), cookie.expires]);
	}
	function getExpires(cookie) {
	  return cookie.expires;
	}
	function getMaxExpires(cookies) {
	  const expires = map(getExpires, cookies);
	  return Math.max.apply(null, expires);
	}
	function saveCookies(cookiesMap, domain, secure) {
	  const cookies = toArray(cookiesMap);
	  const maxExpires = Math.abs(getMaxExpires(cookies) * 1000 - now());
	  const serializedCookies = join("|", map(serialize, cookies));
	  const expires = new Date(now() + maxExpires);
	  const attrs = reactorObjectAssign({
	    domain,
	    expires,
	    secure
	  }, secure ? {
	    sameSite: SAMESITE_NONE
	  } : {});
	  setCookie(MBOX_COOKIE, serializedCookies, attrs);
	}
	function setTargetCookie(options) {
	  const {
	    name,
	    value,
	    expires,
	    domain,
	    secure
	  } = options;
	  const cookiesMap = readCookies();
	  cookiesMap[name] = createCookie(name, value, Math.ceil(expires + now() / 1000));
	  saveCookies(cookiesMap, domain, secure);
	}

	function isCookiePresent(name) {
	  return isNotBlank(getCookie(name));
	}
	function isParamPresent(win, name) {
	  const {
	    location
	  } = win;
	  const {
	    search
	  } = location;
	  const params = parseQueryString(search);
	  return isNotBlank(params[name]);
	}
	function isRefParamPresent(doc, name) {
	  const {
	    referrer
	  } = doc;
	  const parsedUri = parseUri$1(referrer);
	  const refParams = parsedUri.queryKey;
	  return isNil(refParams) ? false : isNotBlank(refParams[name]);
	}
	function exists(win, doc, name) {
	  return isCookiePresent(name) || isParamPresent(win, name) || isRefParamPresent(doc, name);
	}

	function isCookieEnabled() {
	  const config = getConfig();
	  const cookieDomain = config[COOKIE_DOMAIN];
	  const secure = config[SECURE_ONLY];
	  const attrs = reactorObjectAssign({
	    domain: cookieDomain,
	    secure
	  }, secure ? {
	    sameSite: SAMESITE_NONE
	  } : {});
	  setCookie(CHECK, TRUE, attrs);
	  const result = getCookie(CHECK) === TRUE;
	  removeCookie(CHECK);
	  return result;
	}
	function isDeliveryDisabled() {
	  return exists(window, document, DISABLE);
	}
	function isDeliveryEnabled() {
	  const config = getConfig();
	  const enabled = config[ENABLED];
	  return enabled && isCookieEnabled() && !isDeliveryDisabled();
	}
	function isDebugEnabled() {
	  return exists(window, document, DEBUG);
	}
	function isAuthoringEnabled() {
	  return exists(window, document, AUTHORING);
	}

	const ADOBE_TARGET_PREFIX = "AT:";
	function exists$1(win, method) {
	  const {
	    console
	  } = win;
	  return !isNil(console) && isFunction(console[method]);
	}
	function warn(win, args) {
	  const {
	    console
	  } = win;
	  if (!exists$1(win, "warn")) {
	    return;
	  }
	  console.warn.apply(console, [ADOBE_TARGET_PREFIX].concat(args));
	}
	function debug(win, args) {
	  const {
	    console
	  } = win;
	  if (!exists$1(win, "debug")) {
	    return;
	  }
	  if (isDebugEnabled()) {
	    console.debug.apply(console, [ADOBE_TARGET_PREFIX].concat(args));
	  }
	}

	function logWarn(...args) {
	  warn(window, args);
	}
	function logDebug(...args) {
	  debug(window, args);
	}
	const logger = {
	  debug: logDebug,
	  error: logWarn,
	  built: true
	};

	const TRACES_FORMAT_VERSION = "1";
	function getSettings(config) {
	  return reduce((acc, key) => {
	    acc[key] = config[key];
	    return acc;
	  }, {}, OVERRIDABLE_SETTINGS);
	}
	function initialize(win, config, debugEnabled) {
	  const result = win[TRACES] || [];
	  win[TRACES] = result;
	  if (!debugEnabled) {
	    return;
	  }
	  const oldPush = result.push;
	  result[VERSION] = TRACES_FORMAT_VERSION;
	  result[SETTINGS] = getSettings(config);
	  result[CLIENT_TRACES] = [];
	  result[SERVER_TRACES] = [];
	  result.push = function push(trace) {
	    result[SERVER_TRACES].push(reactorObjectAssign({
	      timestamp: now()
	    }, trace));
	    oldPush.call(this, trace);
	  };
	}
	function saveTrace(win, namespace, trace, debugEnabled) {
	  if (namespace === SERVER_TRACES) {
	    win[TRACES].push(trace);
	  }
	  if (!debugEnabled) {
	    return;
	  }
	  if (namespace !== SERVER_TRACES) {
	    win[TRACES][namespace].push(reactorObjectAssign({
	      timestamp: now()
	    }, trace));
	  }
	}

	function initTraces() {
	  initialize(window, getConfig(), isDebugEnabled());
	}
	function addServerTrace(trace) {
	  saveTrace(window, SERVER_TRACES, trace, isDebugEnabled());
	}
	function addClientTrace(trace) {
	  saveTrace(window, CLIENT_TRACES, trace, isDebugEnabled());
	}

	function finallyConstructor(callback) {
	  var constructor = this.constructor;
	  return this.then(function (value) {
	    return constructor.resolve(callback()).then(function () {
	      return value;
	    });
	  }, function (reason) {
	    return constructor.resolve(callback()).then(function () {
	      return constructor.reject(reason);
	    });
	  });
	}

	var setTimeoutFunc = setTimeout;
	function isArray$1(x) {
	  return Boolean(x && typeof x.length !== 'undefined');
	}
	function noop$1() {}
	function bind(fn, thisArg) {
	  return function () {
	    fn.apply(thisArg, arguments);
	  };
	}
	function Promise$1(fn) {
	  if (!(this instanceof Promise$1)) throw new TypeError('Promises must be constructed via new');
	  if (typeof fn !== 'function') throw new TypeError('not a function');
	  this._state = 0;
	  this._handled = false;
	  this._value = undefined;
	  this._deferreds = [];
	  doResolve(fn, this);
	}
	function handle(self, deferred) {
	  while (self._state === 3) {
	    self = self._value;
	  }
	  if (self._state === 0) {
	    self._deferreds.push(deferred);
	    return;
	  }
	  self._handled = true;
	  Promise$1._immediateFn(function () {
	    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
	    if (cb === null) {
	      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
	      return;
	    }
	    var ret;
	    try {
	      ret = cb(self._value);
	    } catch (e) {
	      reject(deferred.promise, e);
	      return;
	    }
	    resolve(deferred.promise, ret);
	  });
	}
	function resolve(self, newValue) {
	  try {
	    if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
	    if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
	      var then = newValue.then;
	      if (newValue instanceof Promise$1) {
	        self._state = 3;
	        self._value = newValue;
	        finale(self);
	        return;
	      } else if (typeof then === 'function') {
	        doResolve(bind(then, newValue), self);
	        return;
	      }
	    }
	    self._state = 1;
	    self._value = newValue;
	    finale(self);
	  } catch (e) {
	    reject(self, e);
	  }
	}
	function reject(self, newValue) {
	  self._state = 2;
	  self._value = newValue;
	  finale(self);
	}
	function finale(self) {
	  if (self._state === 2 && self._deferreds.length === 0) {
	    Promise$1._immediateFn(function () {
	      if (!self._handled) {
	        Promise$1._unhandledRejectionFn(self._value);
	      }
	    });
	  }
	  for (var i = 0, len = self._deferreds.length; i < len; i++) {
	    handle(self, self._deferreds[i]);
	  }
	  self._deferreds = null;
	}
	function Handler(onFulfilled, onRejected, promise) {
	  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
	  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
	  this.promise = promise;
	}
	function doResolve(fn, self) {
	  var done = false;
	  try {
	    fn(function (value) {
	      if (done) return;
	      done = true;
	      resolve(self, value);
	    }, function (reason) {
	      if (done) return;
	      done = true;
	      reject(self, reason);
	    });
	  } catch (ex) {
	    if (done) return;
	    done = true;
	    reject(self, ex);
	  }
	}
	Promise$1.prototype['catch'] = function (onRejected) {
	  return this.then(null, onRejected);
	};
	Promise$1.prototype.then = function (onFulfilled, onRejected) {
	  var prom = new this.constructor(noop$1);
	  handle(this, new Handler(onFulfilled, onRejected, prom));
	  return prom;
	};
	Promise$1.prototype['finally'] = finallyConstructor;
	Promise$1.all = function (arr) {
	  return new Promise$1(function (resolve, reject) {
	    if (!isArray$1(arr)) {
	      return reject(new TypeError('Promise.all accepts an array'));
	    }
	    var args = Array.prototype.slice.call(arr);
	    if (args.length === 0) return resolve([]);
	    var remaining = args.length;
	    function res(i, val) {
	      try {
	        if (val && (typeof val === 'object' || typeof val === 'function')) {
	          var then = val.then;
	          if (typeof then === 'function') {
	            then.call(val, function (val) {
	              res(i, val);
	            }, reject);
	            return;
	          }
	        }
	        args[i] = val;
	        if (--remaining === 0) {
	          resolve(args);
	        }
	      } catch (ex) {
	        reject(ex);
	      }
	    }
	    for (var i = 0; i < args.length; i++) {
	      res(i, args[i]);
	    }
	  });
	};
	Promise$1.resolve = function (value) {
	  if (value && typeof value === 'object' && value.constructor === Promise$1) {
	    return value;
	  }
	  return new Promise$1(function (resolve) {
	    resolve(value);
	  });
	};
	Promise$1.reject = function (value) {
	  return new Promise$1(function (resolve, reject) {
	    reject(value);
	  });
	};
	Promise$1.race = function (arr) {
	  return new Promise$1(function (resolve, reject) {
	    if (!isArray$1(arr)) {
	      return reject(new TypeError('Promise.race accepts an array'));
	    }
	    for (var i = 0, len = arr.length; i < len; i++) {
	      Promise$1.resolve(arr[i]).then(resolve, reject);
	    }
	  });
	};
	Promise$1._immediateFn =
	typeof setImmediate === 'function' && function (fn) {
	  setImmediate(fn);
	} || function (fn) {
	  setTimeoutFunc(fn, 0);
	};
	Promise$1._unhandledRejectionFn = function _unhandledRejectionFn(err) {
	  if (typeof console !== 'undefined' && console) {
	    console.warn('Possible Unhandled Promise Rejection:', err);
	  }
	};

	var src = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': Promise$1
	});

	var require$$0 = getCjsExportFromNamespace(src);

	var reactorPromise = typeof window !== 'undefined' && window.Promise || typeof commonjsGlobal !== 'undefined' && commonjsGlobal.Promise || require$$0.default || require$$0;

	var $ = (function (window) {
	  var Zepto = function () {
	    var undefined$1,
	        key,
	        $,
	        classList,
	        emptyArray = [],
	        concat = emptyArray.concat,
	        filter = emptyArray.filter,
	        slice = emptyArray.slice,
	        document = window.document,
	        elementDisplay = {},
	        classCache = {},
	        cssNumber = {
	      "column-count": 1,
	      columns: 1,
	      "font-weight": 1,
	      "line-height": 1,
	      opacity: 1,
	      "z-index": 1,
	      zoom: 1
	    },
	        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
	        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
	        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	        rootNodeRE = /^(?:body|html)$/i,
	        capitalRE = /([A-Z])/g,
	    methodAttributes = ["val", "css", "html", "text", "data", "width", "height", "offset"],
	        adjacencyOperators = ["after", "prepend", "before", "append"],
	        table = document.createElement("table"),
	        tableRow = document.createElement("tr"),
	        containers = {
	      tr: document.createElement("tbody"),
	      tbody: table,
	      thead: table,
	      tfoot: table,
	      td: tableRow,
	      th: tableRow,
	      "*": document.createElement("div")
	    },
	        readyRE = /complete|loaded|interactive/,
	        simpleSelectorRE = /^[\w-]*$/,
	        class2type = {},
	        toString = class2type.toString,
	        zepto = {},
	        camelize,
	        uniq,
	        tempParent = document.createElement("div"),
	        propMap = {
	      tabindex: "tabIndex",
	      readonly: "readOnly",
	      'for': "htmlFor",
	      'class': "className",
	      maxlength: "maxLength",
	      cellspacing: "cellSpacing",
	      cellpadding: "cellPadding",
	      rowspan: "rowSpan",
	      colspan: "colSpan",
	      usemap: "useMap",
	      frameborder: "frameBorder",
	      contenteditable: "contentEditable"
	    },
	        isArray = Array.isArray || function (object) {
	      return object instanceof Array;
	    };
	    zepto.matches = function (element, selector) {
	      if (!selector || !element || element.nodeType !== 1) return false;
	      var matchesSelector = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector || element.matchesSelector;
	      if (matchesSelector) return matchesSelector.call(element, selector);
	      var match,
	          parent = element.parentNode,
	          temp = !parent;
	      if (temp) (parent = tempParent).appendChild(element);
	      match = ~zepto.qsa(parent, selector).indexOf(element);
	      temp && tempParent.removeChild(element);
	      return match;
	    };
	    function type(obj) {
	      return obj == null ? String(obj) : class2type[toString.call(obj)] || "object";
	    }
	    function isFunction(value) {
	      return type(value) == "function";
	    }
	    function isWindow(obj) {
	      return obj != null && obj == obj.window;
	    }
	    function isDocument(obj) {
	      return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
	    }
	    function isObject(obj) {
	      return type(obj) == "object";
	    }
	    function isPlainObject(obj) {
	      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
	    }
	    function likeArray(obj) {
	      var length = !!obj && "length" in obj && obj.length,
	          type = $.type(obj);
	      return "function" != type && !isWindow(obj) && ("array" == type || length === 0 || typeof length == "number" && length > 0 && length - 1 in obj);
	    }
	    function compact(array) {
	      return filter.call(array, function (item) {
	        return item != null;
	      });
	    }
	    function flatten(array) {
	      return array.length > 0 ? $.fn.concat.apply([], array) : array;
	    }
	    camelize = function (str) {
	      return str.replace(/-+(.)?/g, function (match, chr) {
	        return chr ? chr.toUpperCase() : "";
	      });
	    };
	    function dasherize(str) {
	      return str.replace(/::/g, "/").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/_/g, "-").toLowerCase();
	    }
	    uniq = function (array) {
	      return filter.call(array, function (item, idx) {
	        return array.indexOf(item) == idx;
	      });
	    };
	    function classRE(name) {
	      return name in classCache ? classCache[name] : classCache[name] = new RegExp("(^|\\s)" + name + "(\\s|$)");
	    }
	    function maybeAddPx(name, value) {
	      return typeof value == "number" && !cssNumber[dasherize(name)] ? value + "px" : value;
	    }
	    function defaultDisplay(nodeName) {
	      var element, display;
	      if (!elementDisplay[nodeName]) {
	        element = document.createElement(nodeName);
	        document.body.appendChild(element);
	        display = getComputedStyle(element, "").getPropertyValue("display");
	        element.parentNode.removeChild(element);
	        display == "none" && (display = "block");
	        elementDisplay[nodeName] = display;
	      }
	      return elementDisplay[nodeName];
	    }
	    function children(element) {
	      return "children" in element ? slice.call(element.children) : $.map(element.childNodes, function (node) {
	        if (node.nodeType == 1) return node;
	      });
	    }
	    function Z(dom, selector) {
	      var i,
	          len = dom ? dom.length : 0;
	      for (i = 0; i < len; i++) this[i] = dom[i];
	      this.length = len;
	      this.selector = selector || "";
	    }
	    zepto.fragment = function (html, name, properties) {
	      var dom, nodes, container;
	      if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1));
	      if (!dom) {
	        if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>");
	        if (name === undefined$1) name = fragmentRE.test(html) && RegExp.$1;
	        if (!(name in containers)) name = "*";
	        container = containers[name];
	        container.innerHTML = "" + html;
	        dom = $.each(slice.call(container.childNodes), function () {
	          container.removeChild(this);
	        });
	      }
	      if (isPlainObject(properties)) {
	        nodes = $(dom);
	        $.each(properties, function (key, value) {
	          if (methodAttributes.indexOf(key) > -1) nodes[key](value);else nodes.attr(key, value);
	        });
	      }
	      return dom;
	    };
	    zepto.Z = function (dom, selector) {
	      return new Z(dom, selector);
	    };
	    zepto.isZ = function (object) {
	      return object instanceof zepto.Z;
	    };
	    zepto.init = function (selector, context) {
	      var dom;
	      if (!selector) return zepto.Z();else if (typeof selector == "string") {
	        selector = selector.trim();
	        if (selector[0] == "<" && fragmentRE.test(selector)) dom = zepto.fragment(selector, RegExp.$1, context), selector = null;else if (context !== undefined$1)
	          return $(context).find(selector);
	        else dom = zepto.qsa(document, selector);
	      } else if (isFunction(selector))
	        return $(document).ready(selector);else if (zepto.isZ(selector))
	        return selector;else {
	        if (isArray(selector)) dom = compact(selector);else if (isObject(selector))
	          dom = [selector], selector = null;else if (fragmentRE.test(selector))
	          dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;else if (context !== undefined$1)
	          return $(context).find(selector);
	        else dom = zepto.qsa(document, selector);
	      }
	      return zepto.Z(dom, selector);
	    };
	    $ = function (selector, context) {
	      return zepto.init(selector, context);
	    };
	    function extend(target, source, deep) {
	      for (key in source) if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
	        if (isPlainObject(source[key]) && !isPlainObject(target[key])) target[key] = {};
	        if (isArray(source[key]) && !isArray(target[key])) target[key] = [];
	        extend(target[key], source[key], deep);
	      } else if (source[key] !== undefined$1) target[key] = source[key];
	    }
	    $.extend = function (target) {
	      var deep,
	          args = slice.call(arguments, 1);
	      if (typeof target == "boolean") {
	        deep = target;
	        target = args.shift();
	      }
	      args.forEach(function (arg) {
	        extend(target, arg, deep);
	      });
	      return target;
	    };
	    zepto.qsa = function (element, selector) {
	      var found,
	          maybeID = selector[0] == "#",
	          maybeClass = !maybeID && selector[0] == ".",
	          nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
	      isSimple = simpleSelectorRE.test(nameOnly);
	      return element.getElementById && isSimple && maybeID
	      ? (found = element.getElementById(nameOnly)) ? [found] : [] : element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11 ? [] : slice.call(isSimple && !maybeID && element.getElementsByClassName
	      ? maybeClass ? element.getElementsByClassName(nameOnly)
	      : element.getElementsByTagName(selector)
	      : element.querySelectorAll(selector)
	      );
	    };
	    function filtered(nodes, selector) {
	      return selector == null ? $(nodes) : $(nodes).filter(selector);
	    }
	    $.contains = document.documentElement.contains ? function (parent, node) {
	      return parent !== node && parent.contains(node);
	    } : function (parent, node) {
	      while (node && (node = node.parentNode)) if (node === parent) return true;
	      return false;
	    };
	    function funcArg(context, arg, idx, payload) {
	      return isFunction(arg) ? arg.call(context, idx, payload) : arg;
	    }
	    function setAttribute(node, name, value) {
	      value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
	    }
	    function className(node, value) {
	      var klass = node.className || "",
	          svg = klass && klass.baseVal !== undefined$1;
	      if (value === undefined$1) return svg ? klass.baseVal : klass;
	      svg ? klass.baseVal = value : node.className = value;
	    }
	    function deserializeValue(value) {
	      try {
	        return value ? value == "true" || (value == "false" ? false : value == "null" ? null : +value + "" == value ? +value : /^[\[\{]/.test(value) ? $.parseJSON(value) : value) : value;
	      } catch (e) {
	        return value;
	      }
	    }
	    $.type = type;
	    $.isFunction = isFunction;
	    $.isWindow = isWindow;
	    $.isArray = isArray;
	    $.isPlainObject = isPlainObject;
	    $.isEmptyObject = function (obj) {
	      var name;
	      for (name in obj) return false;
	      return true;
	    };
	    $.isNumeric = function (val) {
	      var num = Number(val),
	          type = typeof val;
	      return val != null && type != "boolean" && (type != "string" || val.length) && !isNaN(num) && isFinite(num) || false;
	    };
	    $.inArray = function (elem, array, i) {
	      return emptyArray.indexOf.call(array, elem, i);
	    };
	    $.camelCase = camelize;
	    $.trim = function (str) {
	      return str == null ? "" : String.prototype.trim.call(str);
	    };
	    $.uuid = 0;
	    $.support = {};
	    $.expr = {};
	    $.noop = function () {};
	    $.map = function (elements, callback) {
	      var value,
	          values = [],
	          i,
	          key;
	      if (likeArray(elements)) for (i = 0; i < elements.length; i++) {
	        value = callback(elements[i], i);
	        if (value != null) values.push(value);
	      } else for (key in elements) {
	        value = callback(elements[key], key);
	        if (value != null) values.push(value);
	      }
	      return flatten(values);
	    };
	    $.each = function (elements, callback) {
	      var i, key;
	      if (likeArray(elements)) {
	        for (i = 0; i < elements.length; i++) if (callback.call(elements[i], i, elements[i]) === false) return elements;
	      } else {
	        for (key in elements) if (callback.call(elements[key], key, elements[key]) === false) return elements;
	      }
	      return elements;
	    };
	    $.grep = function (elements, callback) {
	      return filter.call(elements, callback);
	    };
	    if (window.JSON) $.parseJSON = JSON.parse;
	    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
	      class2type["[object " + name + "]"] = name.toLowerCase();
	    });
	    $.fn = {
	      constructor: zepto.Z,
	      length: 0,
	      forEach: emptyArray.forEach,
	      reduce: emptyArray.reduce,
	      push: emptyArray.push,
	      sort: emptyArray.sort,
	      splice: emptyArray.splice,
	      indexOf: emptyArray.indexOf,
	      concat: function () {
	        var i,
	            value,
	            args = [];
	        for (i = 0; i < arguments.length; i++) {
	          value = arguments[i];
	          args[i] = zepto.isZ(value) ? value.toArray() : value;
	        }
	        return concat.apply(zepto.isZ(this) ? this.toArray() : this, args);
	      },
	      map: function (fn) {
	        return $($.map(this, function (el, i) {
	          return fn.call(el, i, el);
	        }));
	      },
	      slice: function () {
	        return $(slice.apply(this, arguments));
	      },
	      ready: function (callback) {
	        if (readyRE.test(document.readyState) && document.body) callback($);else document.addEventListener("DOMContentLoaded", function () {
	          callback($);
	        }, false);
	        return this;
	      },
	      get: function (idx) {
	        return idx === undefined$1 ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
	      },
	      toArray: function () {
	        return this.get();
	      },
	      size: function () {
	        return this.length;
	      },
	      remove: function () {
	        return this.each(function () {
	          if (this.parentNode != null) this.parentNode.removeChild(this);
	        });
	      },
	      each: function (callback) {
	        var len = this.length,
	            idx = 0,
	            el;
	        while (idx < len) {
	          el = this[idx];
	          if (callback.call(el, idx, el) === false) {
	            break;
	          }
	          idx++;
	        }
	        return this;
	      },
	      filter: function (selector) {
	        if (isFunction(selector)) return this.not(this.not(selector));
	        return $(filter.call(this, function (element) {
	          return zepto.matches(element, selector);
	        }));
	      },
	      add: function (selector, context) {
	        return $(uniq(this.concat($(selector, context))));
	      },
	      is: function (selector) {
	        return this.length > 0 && zepto.matches(this[0], selector);
	      },
	      not: function (selector) {
	        var nodes = [];
	        if (isFunction(selector) && selector.call !== undefined$1) this.each(function (idx) {
	          if (!selector.call(this, idx)) nodes.push(this);
	        });else {
	          var excludes = typeof selector == "string" ? this.filter(selector) : likeArray(selector) && isFunction(selector.item) ? slice.call(selector) : $(selector);
	          this.forEach(function (el) {
	            if (excludes.indexOf(el) < 0) nodes.push(el);
	          });
	        }
	        return $(nodes);
	      },
	      has: function (selector) {
	        return this.filter(function () {
	          return isObject(selector) ? $.contains(this, selector) : $(this).find(selector).size();
	        });
	      },
	      eq: function (idx) {
	        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
	      },
	      first: function () {
	        var el = this[0];
	        return el && !isObject(el) ? el : $(el);
	      },
	      last: function () {
	        var el = this[this.length - 1];
	        return el && !isObject(el) ? el : $(el);
	      },
	      find: function (selector) {
	        var result,
	            $this = this;
	        if (!selector) result = $();else if (typeof selector == "object") result = $(selector).filter(function () {
	          var node = this;
	          return emptyArray.some.call($this, function (parent) {
	            return $.contains(parent, node);
	          });
	        });else if (this.length == 1) result = $(zepto.qsa(this[0], selector));else result = this.map(function () {
	          return zepto.qsa(this, selector);
	        });
	        return result;
	      },
	      closest: function (selector, context) {
	        var nodes = [],
	            collection = typeof selector == "object" && $(selector);
	        this.each(function (_, node) {
	          while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector))) node = node !== context && !isDocument(node) && node.parentNode;
	          if (node && nodes.indexOf(node) < 0) nodes.push(node);
	        });
	        return $(nodes);
	      },
	      parents: function (selector) {
	        var ancestors = [],
	            nodes = this;
	        while (nodes.length > 0) nodes = $.map(nodes, function (node) {
	          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
	            ancestors.push(node);
	            return node;
	          }
	        });
	        return filtered(ancestors, selector);
	      },
	      parent: function (selector) {
	        return filtered(uniq(this.pluck("parentNode")), selector);
	      },
	      children: function (selector) {
	        return filtered(this.map(function () {
	          return children(this);
	        }), selector);
	      },
	      contents: function () {
	        return this.map(function () {
	          return this.contentDocument || slice.call(this.childNodes);
	        });
	      },
	      siblings: function (selector) {
	        return filtered(this.map(function (i, el) {
	          return filter.call(children(el.parentNode), function (child) {
	            return child !== el;
	          });
	        }), selector);
	      },
	      empty: function () {
	        return this.each(function () {
	          this.innerHTML = "";
	        });
	      },
	      pluck: function (property) {
	        return $.map(this, function (el) {
	          return el[property];
	        });
	      },
	      show: function () {
	        return this.each(function () {
	          this.style.display == "none" && (this.style.display = "");
	          if (getComputedStyle(this, "").getPropertyValue("display") == "none") this.style.display = defaultDisplay(this.nodeName);
	        });
	      },
	      replaceWith: function (newContent) {
	        return this.before(newContent).remove();
	      },
	      wrap: function (structure) {
	        var func = isFunction(structure);
	        if (this[0] && !func) var dom = $(structure).get(0),
	            clone = dom.parentNode || this.length > 1;
	        return this.each(function (index) {
	          $(this).wrapAll(func ? structure.call(this, index) : clone ? dom.cloneNode(true) : dom);
	        });
	      },
	      wrapAll: function (structure) {
	        if (this[0]) {
	          $(this[0]).before(structure = $(structure));
	          var children;
	          while ((children = structure.children()).length) structure = children.first();
	          $(structure).append(this);
	        }
	        return this;
	      },
	      wrapInner: function (structure) {
	        var func = isFunction(structure);
	        return this.each(function (index) {
	          var self = $(this),
	              contents = self.contents(),
	              dom = func ? structure.call(this, index) : structure;
	          contents.length ? contents.wrapAll(dom) : self.append(dom);
	        });
	      },
	      unwrap: function () {
	        this.parent().each(function () {
	          $(this).replaceWith($(this).children());
	        });
	        return this;
	      },
	      clone: function () {
	        return this.map(function () {
	          return this.cloneNode(true);
	        });
	      },
	      hide: function () {
	        return this.css("display", "none");
	      },
	      toggle: function (setting) {
	        return this.each(function () {
	          var el = $(this);
	          (setting === undefined$1 ? el.css("display") == "none" : setting) ? el.show() : el.hide();
	        });
	      },
	      prev: function (selector) {
	        return $(this.pluck("previousElementSibling")).filter(selector || "*");
	      },
	      next: function (selector) {
	        return $(this.pluck("nextElementSibling")).filter(selector || "*");
	      },
	      html: function (html) {
	        return 0 in arguments ? this.each(function (idx) {
	          var originHtml = this.innerHTML;
	          $(this).empty().append(funcArg(this, html, idx, originHtml));
	        }) : 0 in this ? this[0].innerHTML : null;
	      },
	      text: function (text) {
	        return 0 in arguments ? this.each(function (idx) {
	          var newText = funcArg(this, text, idx, this.textContent);
	          this.textContent = newText == null ? "" : "" + newText;
	        }) : 0 in this ? this.pluck("textContent").join("") : null;
	      },
	      attr: function (name, value) {
	        var result;
	        return typeof name == "string" && !(1 in arguments) ? 0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined$1 : this.each(function (idx) {
	          if (this.nodeType !== 1) return;
	          if (isObject(name)) for (key in name) setAttribute(this, key, name[key]);else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
	        });
	      },
	      removeAttr: function (name) {
	        return this.each(function () {
	          this.nodeType === 1 && name.split(" ").forEach(function (attribute) {
	            setAttribute(this, attribute);
	          }, this);
	        });
	      },
	      prop: function (name, value) {
	        name = propMap[name] || name;
	        return 1 in arguments ? this.each(function (idx) {
	          this[name] = funcArg(this, value, idx, this[name]);
	        }) : this[0] && this[0][name];
	      },
	      removeProp: function (name) {
	        name = propMap[name] || name;
	        return this.each(function () {
	          delete this[name];
	        });
	      },
	      data: function (name, value) {
	        var attrName = "data-" + name.replace(capitalRE, "-$1").toLowerCase();
	        var data = 1 in arguments ? this.attr(attrName, value) : this.attr(attrName);
	        return data !== null ? deserializeValue(data) : undefined$1;
	      },
	      val: function (value) {
	        if (0 in arguments) {
	          if (value == null) value = "";
	          return this.each(function (idx) {
	            this.value = funcArg(this, value, idx, this.value);
	          });
	        } else {
	          return this[0] && (this[0].multiple ? $(this[0]).find("option").filter(function () {
	            return this.selected;
	          }).pluck("value") : this[0].value);
	        }
	      },
	      offset: function (coordinates) {
	        if (coordinates) return this.each(function (index) {
	          var $this = $(this),
	              coords = funcArg(this, coordinates, index, $this.offset()),
	              parentOffset = $this.offsetParent().offset(),
	              props = {
	            top: coords.top - parentOffset.top,
	            left: coords.left - parentOffset.left
	          };
	          if ($this.css("position") == "static") props["position"] = "relative";
	          $this.css(props);
	        });
	        if (!this.length) return null;
	        if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0])) return {
	          top: 0,
	          left: 0
	        };
	        var obj = this[0].getBoundingClientRect();
	        return {
	          left: obj.left + window.pageXOffset,
	          top: obj.top + window.pageYOffset,
	          width: Math.round(obj.width),
	          height: Math.round(obj.height)
	        };
	      },
	      css: function (property, value) {
	        if (arguments.length < 2) {
	          var element = this[0];
	          if (typeof property == "string") {
	            if (!element) return;
	            return element.style[camelize(property)] || getComputedStyle(element, "").getPropertyValue(property);
	          } else if (isArray(property)) {
	            if (!element) return;
	            var props = {};
	            var computedStyle = getComputedStyle(element, "");
	            $.each(property, function (_, prop) {
	              props[prop] = element.style[camelize(prop)] || computedStyle.getPropertyValue(prop);
	            });
	            return props;
	          }
	        }
	        var css = "";
	        if (type(property) == "string") {
	          if (!value && value !== 0) this.each(function () {
	            this.style.removeProperty(dasherize(property));
	          });else css = dasherize(property) + ":" + maybeAddPx(property, value);
	        } else {
	          for (key in property) if (!property[key] && property[key] !== 0) this.each(function () {
	            this.style.removeProperty(dasherize(key));
	          });else css += dasherize(key) + ":" + maybeAddPx(key, property[key]) + ";";
	        }
	        return this.each(function () {
	          this.style.cssText += ";" + css;
	        });
	      },
	      index: function (element) {
	        return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0]);
	      },
	      hasClass: function (name) {
	        if (!name) return false;
	        return emptyArray.some.call(this, function (el) {
	          return this.test(className(el));
	        }, classRE(name));
	      },
	      addClass: function (name) {
	        if (!name) return this;
	        return this.each(function (idx) {
	          if (!("className" in this)) return;
	          classList = [];
	          var cls = className(this),
	              newName = funcArg(this, name, idx, cls);
	          newName.split(/\s+/g).forEach(function (klass) {
	            if (!$(this).hasClass(klass)) classList.push(klass);
	          }, this);
	          classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "));
	        });
	      },
	      removeClass: function (name) {
	        return this.each(function (idx) {
	          if (!("className" in this)) return;
	          if (name === undefined$1) return className(this, "");
	          classList = className(this);
	          funcArg(this, name, idx, classList).split(/\s+/g).forEach(function (klass) {
	            classList = classList.replace(classRE(klass), " ");
	          });
	          className(this, classList.trim());
	        });
	      },
	      toggleClass: function (name, when) {
	        if (!name) return this;
	        return this.each(function (idx) {
	          var $this = $(this),
	              names = funcArg(this, name, idx, className(this));
	          names.split(/\s+/g).forEach(function (klass) {
	            (when === undefined$1 ? !$this.hasClass(klass) : when) ? $this.addClass(klass) : $this.removeClass(klass);
	          });
	        });
	      },
	      scrollTop: function (value) {
	        if (!this.length) return;
	        var hasScrollTop = ("scrollTop" in this[0]);
	        if (value === undefined$1) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset;
	        return this.each(hasScrollTop ? function () {
	          this.scrollTop = value;
	        } : function () {
	          this.scrollTo(this.scrollX, value);
	        });
	      },
	      scrollLeft: function (value) {
	        if (!this.length) return;
	        var hasScrollLeft = ("scrollLeft" in this[0]);
	        if (value === undefined$1) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset;
	        return this.each(hasScrollLeft ? function () {
	          this.scrollLeft = value;
	        } : function () {
	          this.scrollTo(value, this.scrollY);
	        });
	      },
	      position: function () {
	        if (!this.length) return;
	        var elem = this[0],
	        offsetParent = this.offsetParent(),
	        offset = this.offset(),
	            parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
	          top: 0,
	          left: 0
	        } : offsetParent.offset();
	        offset.top -= parseFloat($(elem).css("margin-top")) || 0;
	        offset.left -= parseFloat($(elem).css("margin-left")) || 0;
	        parentOffset.top += parseFloat($(offsetParent[0]).css("border-top-width")) || 0;
	        parentOffset.left += parseFloat($(offsetParent[0]).css("border-left-width")) || 0;
	        return {
	          top: offset.top - parentOffset.top,
	          left: offset.left - parentOffset.left
	        };
	      },
	      offsetParent: function () {
	        return this.map(function () {
	          var parent = this.offsetParent || document.body;
	          while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static") parent = parent.offsetParent;
	          return parent;
	        });
	      }
	    };
	    $.fn.detach = $.fn.remove;
	    ["width", "height"].forEach(function (dimension) {
	      var dimensionProperty = dimension.replace(/./, function (m) {
	        return m[0].toUpperCase();
	      });
	      $.fn[dimension] = function (value) {
	        var offset,
	            el = this[0];
	        if (value === undefined$1) return isWindow(el) ? el["inner" + dimensionProperty] : isDocument(el) ? el.documentElement["scroll" + dimensionProperty] : (offset = this.offset()) && offset[dimension];else return this.each(function (idx) {
	          el = $(this);
	          el.css(dimension, funcArg(this, value, idx, el[dimension]()));
	        });
	      };
	    });
	    function traverseNode(node, fun) {
	      fun(node);
	      for (var i = 0, len = node.childNodes.length; i < len; i++) traverseNode(node.childNodes[i], fun);
	    }
	    function executeScript(doc, content, nonce) {
	      const nearestNode = doc.getElementsByTagName("script")[0];
	      if (!nearestNode) {
	        return;
	      }
	      const parentNode = nearestNode.parentNode;
	      if (!parentNode) {
	        return;
	      }
	      const script = doc.createElement("script");
	      script.innerHTML = content;
	      if (isNotBlank(nonce)) {
	        script.setAttribute("nonce", nonce);
	      }
	      parentNode.appendChild(script);
	      parentNode.removeChild(script);
	    }
	    adjacencyOperators.forEach(function (operator, operatorIndex) {
	      var inside = operatorIndex % 2;
	      $.fn[operator] = function () {
	        var argType,
	            nodes = $.map(arguments, function (arg) {
	          var arr = [];
	          argType = type(arg);
	          if (argType == "array") {
	            arg.forEach(function (el) {
	              if (el.nodeType !== undefined$1) return arr.push(el);else if ($.zepto.isZ(el)) return arr = arr.concat(el.get());
	              arr = arr.concat(zepto.fragment(el));
	            });
	            return arr;
	          }
	          return argType == "object" || arg == null ? arg : zepto.fragment(arg);
	        }),
	            parent,
	            copyByClone = this.length > 1;
	        if (nodes.length < 1) return this;
	        return this.each(function (_, target) {
	          parent = inside ? target : target.parentNode;
	          target = operatorIndex == 0 ? target.nextSibling : operatorIndex == 1 ? target.firstChild : operatorIndex == 2 ? target : null;
	          const parentInDocument = $.contains(document.documentElement, parent);
	          const SCRIPT_TYPES = /^(text|application)\/(javascript|ecmascript)$/;
	          const config = getConfig();
	          const scriptNonce = config[CSP_SCRIPT_NONCE];
	          const styleNonce = config[CSP_STYLE_NONCE];
	          nodes.forEach(function (node) {
	            if (copyByClone) node = node.cloneNode(true);else if (!parent) return $(node).remove();
	            if (isNotBlank(scriptNonce) && node.tagName === "SCRIPT") {
	              node.setAttribute("nonce", scriptNonce);
	            }
	            if (isNotBlank(styleNonce) && node.tagName === "STYLE") {
	              node.setAttribute("nonce", styleNonce);
	            }
	            parent.insertBefore(node, target);
	            if (parentInDocument) traverseNode(node, function (el) {
	              if (el.nodeName != null && el.nodeName.toUpperCase() === "SCRIPT" && (!el.type || SCRIPT_TYPES.test(el.type.toLowerCase())) && !el.src) {
	                executeScript(document, el.innerHTML, el.nonce);
	              }
	            });
	          });
	        });
	      };
	      $.fn[inside ? operator + "To" : "insert" + (operatorIndex ? "Before" : "After")] = function (html) {
	        $(html)[operator](this);
	        return this;
	      };
	    });
	    zepto.Z.prototype = Z.prototype = $.fn;
	    zepto.uniq = uniq;
	    zepto.deserializeValue = deserializeValue;
	    $.zepto = zepto;
	    return $;
	  }();
	  (function ($) {
	    var _zid = 1,
	        undefined$1,
	        slice = Array.prototype.slice,
	        isFunction = $.isFunction,
	        isString = function (obj) {
	      return typeof obj == "string";
	    },
	        handlers = {},
	        specialEvents = {},
	        focusinSupported = ("onfocusin" in window),
	        focus = {
	      focus: "focusin",
	      blur: "focusout"
	    },
	        hover = {
	      mouseenter: "mouseover",
	      mouseleave: "mouseout"
	    };
	    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = "MouseEvents";
	    function zid(element) {
	      return element._zid || (element._zid = _zid++);
	    }
	    function findHandlers(element, event, fn, selector) {
	      event = parse(event);
	      if (event.ns) var matcher = matcherFor(event.ns);
	      return (handlers[zid(element)] || []).filter(function (handler) {
	        return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || zid(handler.fn) === zid(fn)) && (!selector || handler.sel == selector);
	      });
	    }
	    function parse(event) {
	      var parts = ("" + event).split(".");
	      return {
	        e: parts[0],
	        ns: parts.slice(1).sort().join(" ")
	      };
	    }
	    function matcherFor(ns) {
	      return new RegExp("(?:^| )" + ns.replace(" ", " .* ?") + "(?: |$)");
	    }
	    function eventCapture(handler, captureSetting) {
	      return handler.del && !focusinSupported && handler.e in focus || !!captureSetting;
	    }
	    function realEvent(type) {
	      return hover[type] || focusinSupported && focus[type] || type;
	    }
	    function add(element, events, fn, data, selector, delegator, capture) {
	      var id = zid(element),
	          set = handlers[id] || (handlers[id] = []);
	      events.split(/\s/).forEach(function (event) {
	        if (event == "ready") return $(document).ready(fn);
	        var handler = parse(event);
	        handler.fn = fn;
	        handler.sel = selector;
	        if (handler.e in hover) fn = function (e) {
	          var related = e.relatedTarget;
	          if (!related || related !== this && !$.contains(this, related)) return handler.fn.apply(this, arguments);
	        };
	        handler.del = delegator;
	        var callback = delegator || fn;
	        handler.proxy = function (e) {
	          e = compatible(e);
	          if (e.isImmediatePropagationStopped()) return;
	          e.data = data;
	          var result = callback.apply(element, e._args == undefined$1 ? [e] : [e].concat(e._args));
	          if (result === false) e.preventDefault(), e.stopPropagation();
	          return result;
	        };
	        handler.i = set.length;
	        set.push(handler);
	        if ("addEventListener" in element) element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
	      });
	    }
	    function remove(element, events, fn, selector, capture) {
	      var id = zid(element);
	      (events || "").split(/\s/).forEach(function (event) {
	        findHandlers(element, event, fn, selector).forEach(function (handler) {
	          delete handlers[id][handler.i];
	          if ("removeEventListener" in element) element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
	        });
	      });
	    }
	    $.event = {
	      add: add,
	      remove: remove
	    };
	    $.proxy = function (fn, context) {
	      var args = 2 in arguments && slice.call(arguments, 2);
	      if (isFunction(fn)) {
	        var proxyFn = function () {
	          return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
	        };
	        proxyFn._zid = zid(fn);
	        return proxyFn;
	      } else if (isString(context)) {
	        if (args) {
	          args.unshift(fn[context], fn);
	          return $.proxy.apply(null, args);
	        } else {
	          return $.proxy(fn[context], fn);
	        }
	      } else {
	        throw new TypeError("expected function");
	      }
	    };
	    $.fn.bind = function (event, data, callback) {
	      return this.on(event, data, callback);
	    };
	    $.fn.unbind = function (event, callback) {
	      return this.off(event, callback);
	    };
	    $.fn.one = function (event, selector, data, callback) {
	      return this.on(event, selector, data, callback, 1);
	    };
	    var returnTrue = function () {
	      return true;
	    },
	        returnFalse = function () {
	      return false;
	    },
	        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
	        eventMethods = {
	      preventDefault: "isDefaultPrevented",
	      stopImmediatePropagation: "isImmediatePropagationStopped",
	      stopPropagation: "isPropagationStopped"
	    };
	    function compatible(event, source) {
	      if (source || !event.isDefaultPrevented) {
	        source || (source = event);
	        $.each(eventMethods, function (name, predicate) {
	          var sourceMethod = source[name];
	          event[name] = function () {
	            this[predicate] = returnTrue;
	            return sourceMethod && sourceMethod.apply(source, arguments);
	          };
	          event[predicate] = returnFalse;
	        });
	        try {
	          event.timeStamp || (event.timeStamp = new Date().getTime());
	        } catch (ignored) {}
	        if (source.defaultPrevented !== undefined$1 ? source.defaultPrevented : "returnValue" in source ? source.returnValue === false : source.getPreventDefault && source.getPreventDefault()) event.isDefaultPrevented = returnTrue;
	      }
	      return event;
	    }
	    function createProxy(event) {
	      var key,
	          proxy = {
	        originalEvent: event
	      };
	      for (key in event) if (!ignoreProperties.test(key) && event[key] !== undefined$1) proxy[key] = event[key];
	      return compatible(proxy, event);
	    }
	    $.fn.delegate = function (selector, event, callback) {
	      return this.on(event, selector, callback);
	    };
	    $.fn.undelegate = function (selector, event, callback) {
	      return this.off(event, selector, callback);
	    };
	    $.fn.live = function (event, callback) {
	      $(document.body).delegate(this.selector, event, callback);
	      return this;
	    };
	    $.fn.die = function (event, callback) {
	      $(document.body).undelegate(this.selector, event, callback);
	      return this;
	    };
	    $.fn.on = function (event, selector, data, callback, one) {
	      var autoRemove,
	          delegator,
	          $this = this;
	      if (event && !isString(event)) {
	        $.each(event, function (type, fn) {
	          $this.on(type, selector, data, fn, one);
	        });
	        return $this;
	      }
	      if (!isString(selector) && !isFunction(callback) && callback !== false) callback = data, data = selector, selector = undefined$1;
	      if (callback === undefined$1 || data === false) callback = data, data = undefined$1;
	      if (callback === false) callback = returnFalse;
	      return $this.each(function (_, element) {
	        if (one) autoRemove = function (e) {
	          remove(element, e.type, callback);
	          return callback.apply(this, arguments);
	        };
	        if (selector) delegator = function (e) {
	          var evt,
	              match = $(e.target).closest(selector, element).get(0);
	          if (match && match !== element) {
	            evt = $.extend(createProxy(e), {
	              currentTarget: match,
	              liveFired: element
	            });
	            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
	          }
	        };
	        add(element, event, callback, data, selector, delegator || autoRemove);
	      });
	    };
	    $.fn.off = function (event, selector, callback) {
	      var $this = this;
	      if (event && !isString(event)) {
	        $.each(event, function (type, fn) {
	          $this.off(type, selector, fn);
	        });
	        return $this;
	      }
	      if (!isString(selector) && !isFunction(callback) && callback !== false) callback = selector, selector = undefined$1;
	      if (callback === false) callback = returnFalse;
	      return $this.each(function () {
	        remove(this, event, callback, selector);
	      });
	    };
	    $.fn.trigger = function (event, args) {
	      event = isString(event) || $.isPlainObject(event) ? $.Event(event) : compatible(event);
	      event._args = args;
	      return this.each(function () {
	        if (event.type in focus && typeof this[event.type] == "function") this[event.type]();else if ("dispatchEvent" in this)
	          this.dispatchEvent(event);else $(this).triggerHandler(event, args);
	      });
	    };
	    $.fn.triggerHandler = function (event, args) {
	      var e, result;
	      this.each(function (i, element) {
	        e = createProxy(isString(event) ? $.Event(event) : event);
	        e._args = args;
	        e.target = element;
	        $.each(findHandlers(element, event.type || event), function (i, handler) {
	          result = handler.proxy(e);
	          if (e.isImmediatePropagationStopped()) return false;
	        });
	      });
	      return result;
	    };
	    ("focusin focusout focus blur load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select keydown keypress keyup error").split(" ").forEach(function (event) {
	      $.fn[event] = function (callback) {
	        return 0 in arguments ? this.bind(event, callback) : this.trigger(event);
	      };
	    });
	    $.Event = function (type, props) {
	      if (!isString(type)) props = type, type = props.type;
	      var event = document.createEvent(specialEvents[type] || "Events"),
	          bubbles = true;
	      if (props) for (var name in props) name == "bubbles" ? bubbles = !!props[name] : event[name] = props[name];
	      event.initEvent(type, bubbles, true);
	      return compatible(event);
	    };
	  })(Zepto);
	  (function () {
	    try {
	      getComputedStyle(undefined);
	    } catch (e) {
	      var nativeGetComputedStyle = getComputedStyle;
	      window.getComputedStyle = function (element, pseudoElement) {
	        try {
	          return nativeGetComputedStyle(element, pseudoElement);
	        } catch (e) {
	          return null;
	        }
	      };
	    }
	  })();
	  (function ($) {
	    var zepto = $.zepto,
	        oldQsa = zepto.qsa,
	        childRe = /^\s*>/,
	        classTag = "Zepto" + +new Date();
	    zepto.qsa = function (node, selector) {
	      var sel = selector,
	          nodes,
	          taggedParent;
	      try {
	        if (!sel) sel = "*";else if (childRe.test(sel))
	          taggedParent = $(node).addClass(classTag), sel = "." + classTag + " " + sel;
	        nodes = oldQsa(node, sel);
	      } catch (e) {
	        throw e;
	      } finally {
	        if (taggedParent) taggedParent.removeClass(classTag);
	      }
	      return nodes;
	    };
	  })(Zepto);
	  return Zepto;
	})(window);

	const MO_OBJECT = window.MutationObserver || window.WebkitMutationObserver;
	function canUseMutationObserver() {
	  return isFunction(MO_OBJECT);
	}
	function getMutationObserver(callback) {
	  return new MO_OBJECT(callback);
	}

	const ARRAY_EXPECTED = "Expected an array of promises";
	function getMoImmediateFn() {
	  const textnode = document.createTextNode("");
	  const twiddleNode = () => {
	    textnode.textContent = textnode.textContent.length > 0 ? "" : "a";
	  };
	  const callbacks = [];
	  const mo = getMutationObserver(() => {
	    const len = callbacks.length;
	    for (let i = 0; i < len; i += 1) {
	      callbacks[i]();
	    }
	    callbacks.splice(0, len);
	  });
	  mo.observe(textnode, {
	    characterData: true
	  });
	  return fn => {
	    callbacks.push(fn);
	    twiddleNode();
	  };
	}
	function getOnReadyStateChangeImmediateFn() {
	  return fn => {
	    let scriptEl = $("<script>");
	    scriptEl.on("readystatechange", () => {
	      scriptEl.on("readystatechange", null);
	      scriptEl.remove();
	      scriptEl = null;
	      fn();
	    });
	    $(document.documentElement).append(scriptEl);
	  };
	}
	function setupPromiseImmediateFn() {
	  if (canUseMutationObserver()) {
	    reactorPromise._setImmediateFn(getMoImmediateFn());
	    return;
	  }
	  if (window.navigator.userAgent.indexOf("MSIE 10") !== -1) {
	    reactorPromise._setImmediateFn(getOnReadyStateChangeImmediateFn());
	  }
	}
	if (reactorPromise._setImmediateFn) {
	  setupPromiseImmediateFn();
	}
	function create(func) {
	  return new reactorPromise(func);
	}
	function resolve$1(value) {
	  return reactorPromise.resolve(value);
	}
	function reject$1(value) {
	  return reactorPromise.reject(value);
	}
	function race(arr) {
	  if (!isArray(arr)) {
	    return reject$1(new TypeError(ARRAY_EXPECTED));
	  }
	  return reactorPromise.race(arr);
	}
	function all(arr) {
	  if (!isArray(arr)) {
	    return reject$1(new TypeError(ARRAY_EXPECTED));
	  }
	  return reactorPromise.all(arr);
	}
	function timeout(promise, time, message) {
	  let id = -1;
	  const delayedPromise = create((_, rej) => {
	    id = delay(() => rej(new Error(message)), time);
	  });
	  return race([promise, delayedPromise]).then(val => {
	    cancelDelay(id);
	    return val;
	  }, err => {
	    cancelDelay(id);
	    throw err;
	  });
	}

	function isOptinAvailable(win) {
	  if (isNil(win[ADOBE])) {
	    return false;
	  }
	  const adobe = win[ADOBE];
	  if (isNil(adobe[OPTIN])) {
	    return false;
	  }
	  const optin = adobe[OPTIN];
	  return isFunction(optin[FETCH_PERMISSIONS]) && isFunction(optin[IS_APPROVED]);
	}
	function isOptinEnabled(win, optinEnabled) {
	  if (!optinEnabled) {
	    return false;
	  }
	  return isOptinAvailable(win);
	}
	function isCategoryApproved(win, key) {
	  if (!isOptinAvailable(win)) {
	    return true;
	  }
	  const optIn = win[ADOBE][OPTIN];
	  const categories = win[ADOBE][OPTIN][CATEGORIES] || {};
	  const category = categories[key];
	  return optIn[IS_APPROVED](category);
	}
	function fetchPermissions(win, key) {
	  if (!isOptinAvailable(win)) {
	    return resolve$1(true);
	  }
	  const optIn = win[ADOBE][OPTIN];
	  const categories = win[ADOBE][OPTIN][CATEGORIES] || {};
	  const category = categories[key];
	  return create((res, rej) => {
	    optIn[FETCH_PERMISSIONS](() => {
	      if (optIn[IS_APPROVED](category)) {
	        res(true);
	      } else {
	        rej(ERROR_TARGET_NOT_OPTED_IN);
	      }
	    }, true);
	  });
	}

	function shouldUseOptin() {
	  const config = getConfig();
	  const optinEnabled = config[OPTIN_ENABLED];
	  return isOptinEnabled(window, optinEnabled);
	}
	function isTargetApproved() {
	  return isCategoryApproved(window, TARGET);
	}
	function isAnalyticsApproved() {
	  return isCategoryApproved(window, ANALYTICS);
	}
	function fetchOptinPermissions() {
	  return fetchPermissions(window, TARGET);
	}

	const SESSION_ID = uuid();
	function getSessionIdFromQuery() {
	  const {
	    location
	  } = window;
	  const {
	    search
	  } = location;
	  const params = parseQueryString(search);
	  return params[SESSION_ID_PARAM];
	}
	function saveSessionId(value, config) {
	  setTargetCookie({
	    name: SESSION_ID_COOKIE,
	    value,
	    expires: config[SESSION_ID_LIFETIME],
	    domain: config[COOKIE_DOMAIN],
	    secure: config[SECURE_ONLY]
	  });
	}
	function setSessionId(value) {
	  const config = getConfig();
	  saveSessionId(value, config);
	}
	function getSessionId() {
	  if (shouldUseOptin() && !isTargetApproved()) {
	    return SESSION_ID;
	  }
	  const sessionIdQuery = getSessionIdFromQuery();
	  if (isNotBlank(sessionIdQuery)) {
	    setSessionId(sessionIdQuery);
	    return getTargetCookie(SESSION_ID_COOKIE);
	  }
	  const sessionId = getTargetCookie(SESSION_ID_COOKIE);
	  if (isBlank(sessionId)) {
	    setSessionId(SESSION_ID);
	  } else {
	    setSessionId(sessionId);
	  }
	  return getTargetCookie(SESSION_ID_COOKIE);
	}

	function setDeviceId(value) {
	  const config = getConfig();
	  setTargetCookie({
	    name: DEVICE_ID_COOKIE,
	    value,
	    expires: config[DEVICE_ID_LIFETIME],
	    domain: config[COOKIE_DOMAIN],
	    secure: config[SECURE_ONLY]
	  });
	}
	function getDeviceId() {
	  return getTargetCookie(DEVICE_ID_COOKIE);
	}

	const CLUSTER_ID_REGEX = /.*\.(\d+)_\d+/;
	function extractCluster(id) {
	  if (isBlank(id)) {
	    return "";
	  }
	  const result = CLUSTER_ID_REGEX.exec(id);
	  if (isEmpty(result) || result.length !== 2) {
	    return "";
	  }
	  return result[1];
	}
	function getEdgeCluster() {
	  const config = getConfig();
	  if (!config[OVERRIDE_MBOX_EDGE_SERVER]) {
	    return "";
	  }
	  const result = getCookie(EDGE_CLUSTER_COOKIE);
	  return isBlank(result) ? "" : result;
	}
	function setEdgeCluster(id) {
	  const config = getConfig();
	  if (!config[OVERRIDE_MBOX_EDGE_SERVER]) {
	    return;
	  }
	  const domain = config[COOKIE_DOMAIN];
	  const expires = new Date(now() + config[OVERRIDE_MBOX_EDGE_SERVER_TIMEOUT]);
	  const secure = config[SECURE_ONLY];
	  const savedCluster = getCookie(EDGE_CLUSTER_COOKIE);
	  const attrs = reactorObjectAssign({
	    domain,
	    expires,
	    secure
	  }, secure ? {
	    sameSite: SAMESITE_NONE
	  } : {});
	  if (isNotBlank(savedCluster)) {
	    setCookie(EDGE_CLUSTER_COOKIE, savedCluster, attrs);
	    return;
	  }
	  const cluster = extractCluster(id);
	  if (isBlank(cluster)) {
	    return;
	  }
	  setCookie(EDGE_CLUSTER_COOKIE, cluster, attrs);
	}

	function bootstrapNotify(win, doc) {
	  if (isFunction(win.CustomEvent)) {
	    return;
	  }
	  function CustomEvent(event, params) {
	    const evt = doc.createEvent("CustomEvent");
	    params = params || {
	      bubbles: false,
	      cancelable: false,
	      detail: undefined
	    };
	    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
	    return evt;
	  }
	  CustomEvent.prototype = win.Event.prototype;
	  win.CustomEvent = CustomEvent;
	}
	function createTracking(getSessionId, getDeviceId) {
	  const sessionId = getSessionId();
	  const deviceId = getDeviceId();
	  const result = {};
	  result.sessionId = sessionId;
	  if (isNotBlank(deviceId)) {
	    result.deviceId = deviceId;
	    return result;
	  }
	  return result;
	}
	function notify(win, doc, eventName, detail) {
	  const event = new win.CustomEvent(eventName, {
	    detail
	  });
	  doc.dispatchEvent(event);
	}

	bootstrapNotify(window, document);
	const LIBRARY_LOADED = "at-library-loaded";
	const REQUEST_START = "at-request-start";
	const REQUEST_SUCCEEDED$1 = "at-request-succeeded";
	const REQUEST_FAILED$1 = "at-request-failed";
	const CONTENT_RENDERING_START = "at-content-rendering-start";
	const CONTENT_RENDERING_SUCCEEDED = "at-content-rendering-succeeded";
	const CONTENT_RENDERING_FAILED = "at-content-rendering-failed";
	const CONTENT_RENDERING_NO_OFFERS = "at-content-rendering-no-offers";
	const CONTENT_RENDERING_REDIRECT = "at-content-rendering-redirect";
	function buildPayload(type, detail) {
	  const {
	    mbox,
	    error,
	    url,
	    analyticsDetails,
	    responseTokens,
	    execution
	  } = detail;
	  const tracking = createTracking(getSessionId, getDeviceId);
	  const payload = {
	    type,
	    tracking
	  };
	  if (!isNil(mbox)) {
	    payload.mbox = mbox;
	  }
	  if (!isNil(error)) {
	    payload.error = error;
	  }
	  if (!isNil(url)) {
	    payload.url = url;
	  }
	  if (!isEmpty(analyticsDetails)) {
	    payload.analyticsDetails = analyticsDetails;
	  }
	  if (!isEmpty(responseTokens)) {
	    payload.responseTokens = responseTokens;
	  }
	  if (!isEmpty(execution)) {
	    payload.execution = execution;
	  }
	  return payload;
	}
	function notifyLibraryLoaded() {
	  const payload = buildPayload(LIBRARY_LOADED, {});
	  notify(window, document, LIBRARY_LOADED, payload);
	}
	function notifyRequestStart(detail) {
	  const payload = buildPayload(REQUEST_START, detail);
	  notify(window, document, REQUEST_START, payload);
	}
	function notifyRequestSucceeded(detail, redirect) {
	  const payload = buildPayload(REQUEST_SUCCEEDED$1, detail);
	  payload.redirect = redirect;
	  notify(window, document, REQUEST_SUCCEEDED$1, payload);
	}
	function notifyRequestFailed(detail) {
	  const payload = buildPayload(REQUEST_FAILED$1, detail);
	  notify(window, document, REQUEST_FAILED$1, payload);
	}
	function notifyRenderingStart(detail) {
	  const payload = buildPayload(CONTENT_RENDERING_START, detail);
	  notify(window, document, CONTENT_RENDERING_START, payload);
	}
	function notifyRenderingSucceeded(detail) {
	  const payload = buildPayload(CONTENT_RENDERING_SUCCEEDED, detail);
	  notify(window, document, CONTENT_RENDERING_SUCCEEDED, payload);
	}
	function notifyRenderingFailed(detail) {
	  const payload = buildPayload(CONTENT_RENDERING_FAILED, detail);
	  notify(window, document, CONTENT_RENDERING_FAILED, payload);
	}
	function notifyRenderingNoOffers(detail) {
	  const payload = buildPayload(CONTENT_RENDERING_NO_OFFERS, detail);
	  notify(window, document, CONTENT_RENDERING_NO_OFFERS, payload);
	}
	function notifyRenderingRedirect(detail) {
	  const payload = buildPayload(CONTENT_RENDERING_REDIRECT, detail);
	  notify(window, document, CONTENT_RENDERING_REDIRECT, payload);
	}
	function notifyOnDeviceDecisioning(eventName, payload) {
	  notify(window, document, eventName, payload);
	}

	var getPromise = function (url, script) {
	  return new reactorPromise(function (resolve, reject) {
	    script.onload = function () {
	      resolve(script);
	    };
	    script.onerror = function () {
	      reject(new Error('Failed to load script ' + url));
	    };
	  });
	};
	var reactorLoadScript = function (url) {
	  var script = document.createElement('script');
	  script.src = url;
	  script.async = true;
	  var promise = getPromise(url, script);
	  document.getElementsByTagName('head')[0].appendChild(script);
	  return promise;
	};

	function isElement(value) {
	  return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
	}

	const EQ_START = ":eq(";
	const EQ_END = ")";
	const EQ_LENGTH = EQ_START.length;
	const DIGIT_IN_SELECTOR_PATTERN = /((\.|#)(-)?\d{1})/g;
	function createPair(match) {
	  const first = match.charAt(0);
	  const second = match.charAt(1);
	  const third = match.charAt(2);
	  const result = {
	    key: match
	  };
	  if (second === "-") {
	    result.val = "" + first + second + "\\3" + third + " ";
	  } else {
	    result.val = first + "\\3" + second + " ";
	  }
	  return result;
	}
	function escapeDigitsInSelector(selector) {
	  const matches = selector.match(DIGIT_IN_SELECTOR_PATTERN);
	  if (isEmpty(matches)) {
	    return selector;
	  }
	  const pairs = map(createPair, matches);
	  return reduce((acc, pair) => acc.replace(pair.key, pair.val), selector, pairs);
	}
	function parseSelector(selector) {
	  const result = [];
	  let sel = trim(selector);
	  let currentIndex = sel.indexOf(EQ_START);
	  let head;
	  let tail;
	  let eq;
	  let index;
	  while (currentIndex !== -1) {
	    head = trim(sel.substring(0, currentIndex));
	    tail = trim(sel.substring(currentIndex));
	    index = tail.indexOf(EQ_END);
	    eq = trim(tail.substring(EQ_LENGTH, index));
	    sel = trim(tail.substring(index + 1));
	    currentIndex = sel.indexOf(EQ_START);
	    if (head && eq) {
	      result.push({
	        sel: head,
	        eq: Number(eq)
	      });
	    }
	  }
	  if (sel) {
	    result.push({
	      sel
	    });
	  }
	  return result;
	}
	function select(selector) {
	  if (isElement(selector)) {
	    return $(selector);
	  }
	  if (!isString(selector)) {
	    return $(selector);
	  }
	  const selectorAsString = escapeDigitsInSelector(selector);
	  if (selectorAsString.indexOf(EQ_START) === -1) {
	    return $(selectorAsString);
	  }
	  const parts = parseSelector(selectorAsString);
	  return reduce((acc, part) => {
	    const {
	      sel,
	      eq
	    } = part;
	    acc = acc.find(sel);
	    if (isNumber(eq)) {
	      acc = acc.eq(eq);
	    }
	    return acc;
	  }, $(document), parts);
	}
	function exists$2(selector) {
	  return select(selector).length > 0;
	}
	function fragment(content) {
	  return $("<" + DIV_TAG + "/>").append(content);
	}
	function wrap(content) {
	  return $(content);
	}
	function prev(selector) {
	  return select(selector).prev();
	}
	function next(selector) {
	  return select(selector).next();
	}
	function parent(selector) {
	  return select(selector).parent();
	}
	function is(query, selector) {
	  return select(selector).is(query);
	}
	function find(query, selector) {
	  return select(selector).find(query);
	}
	function children(selector) {
	  return select(selector).children();
	}

	const LOAD_ERROR = "Unable to load target-vec.js";
	const LOAD_AUTHORING = "Loading target-vec.js";
	const NAMESPACE = "_AT";
	const EDITOR = "clickHandlerForExperienceEditor";
	const CURRENT_VIEW = "currentView";
	function initNamespace() {
	  window[NAMESPACE] = window[NAMESPACE] || {};
	  window[NAMESPACE].querySelectorAll = select;
	}
	function handleAuthoringTriggeredView(options) {
	  const viewName = options[VIEW_NAME];
	  window[NAMESPACE][CURRENT_VIEW] = viewName;
	}
	function setupClickHandler() {
	  document.addEventListener(CLICK, event => {
	    if (isFunction(window[NAMESPACE][EDITOR])) {
	      window[NAMESPACE][EDITOR](event);
	    }
	  }, true);
	}
	function initAuthoringCode() {
	  if (!isAuthoringEnabled()) {
	    return;
	  }
	  initNamespace();
	  const config = getConfig();
	  const authoringScriptUrl = config[AUTHORING_SCRIPT_URL];
	  const success = () => setupClickHandler();
	  const error = () => logWarn(LOAD_ERROR);
	  logDebug(LOAD_AUTHORING);
	  reactorLoadScript(authoringScriptUrl).then(success)['catch'](error);
	}

	const QA_MODE_COOKIE = "at_qa_mode";
	const PREVIEW_TOKEN = "at_preview_token";
	const PREVIEW_INDEX = "at_preview_index";
	const ACTIVITIES_ONLY = "at_preview_listed_activities_only";
	const TRUE_AUDIENCE_IDS = "at_preview_evaluate_as_true_audience_ids";
	const FALSE_AUDIENCE_IDS = "at_preview_evaluate_as_false_audience_ids";
	const UNDERSCORE = "_";
	const notNull = v => !isNil(v);
	let qaModeActive = false;
	function toNumber(value) {
	  return parseInt(value, 10);
	}
	function getIndex(value) {
	  const result = toNumber(value);
	  return isNaN(result) ? null : result;
	}
	function extractAudienceIds(value) {
	  return split(UNDERSCORE, value);
	}
	function parsePreviewIndex(value) {
	  const pair = split(UNDERSCORE, value);
	  const activityIndex = getIndex(pair[0]);
	  if (isNil(activityIndex)) {
	    return null;
	  }
	  const result = {};
	  result.activityIndex = activityIndex;
	  const experienceIndex = getIndex(pair[1]);
	  if (!isNil(experienceIndex)) {
	    result.experienceIndex = experienceIndex;
	  }
	  return result;
	}
	function parsePreviewIndexes(values) {
	  return filter(notNull, map(parsePreviewIndex, values));
	}
	function extractPreviewIndexes(value) {
	  if (isArray(value)) {
	    return parsePreviewIndexes(value);
	  }
	  return parsePreviewIndexes([value]);
	}
	function extractQaMode(queryString) {
	  const query = parseQueryString(queryString);
	  const token = query[PREVIEW_TOKEN];
	  if (isBlank(token)) {
	    qaModeActive = false;
	    return null;
	  }
	  qaModeActive = true;
	  const result = {};
	  result.token = token;
	  const listedActivitiesOnly = query[ACTIVITIES_ONLY];
	  if (isNotBlank(listedActivitiesOnly) && listedActivitiesOnly === TRUE) {
	    result.listedActivitiesOnly = true;
	  }
	  const trueAudiences = query[TRUE_AUDIENCE_IDS];
	  if (isNotBlank(trueAudiences)) {
	    result.evaluateAsTrueAudienceIds = extractAudienceIds(trueAudiences);
	  }
	  const falseAudiences = query[FALSE_AUDIENCE_IDS];
	  if (isNotBlank(falseAudiences)) {
	    result.evaluateAsFalseAudienceIds = extractAudienceIds(falseAudiences);
	  }
	  const previewIndexes = query[PREVIEW_INDEX];
	  if (isEmpty(previewIndexes)) {
	    return result;
	  }
	  result.previewIndexes = extractPreviewIndexes(previewIndexes);
	  return result;
	}
	function initQaMode(win) {
	  const result = extractQaMode(win.location.search);
	  if (isNil(result)) {
	    return;
	  }
	  const expires = new Date(now() + 1.86e6);
	  const config = getConfig();
	  const secure = config[SECURE_ONLY];
	  const attrs = reactorObjectAssign({
	    expires,
	    secure
	  }, secure ? {
	    sameSite: SAMESITE_NONE
	  } : {});
	  setCookie(QA_MODE_COOKIE, JSON.stringify(result), attrs);
	}
	function getQaMode() {
	  const result = getCookie(QA_MODE_COOKIE);
	  if (isBlank(result)) {
	    return {};
	  }
	  try {
	    return JSON.parse(result);
	  } catch (e) {
	    return {};
	  }
	}
	function isQaMode() {
	  return qaModeActive;
	}

	const PREVIEW_MODE_COOKIE = "at_preview_mode";
	const PREVIEW_MODE_TOKEN = "at_preview";
	let previewActive = false;
	function extractPreviewMode(queryString) {
	  const query = parseQueryString(queryString);
	  const token = query[PREVIEW_MODE_TOKEN];
	  if (isBlank(token)) {
	    previewActive = false;
	    return null;
	  }
	  previewActive = true;
	  return {
	    token
	  };
	}
	function initPreviewMode(win) {
	  const result = extractPreviewMode(win.location.search);
	  if (isNil(result)) {
	    return;
	  }
	  const expires = new Date(now() + 1.86e6);
	  const config = getConfig();
	  const secure = config[SECURE_ONLY];
	  const attrs = reactorObjectAssign({
	    expires,
	    secure
	  }, secure ? {
	    sameSite: SAMESITE_NONE
	  } : {});
	  setCookie(PREVIEW_MODE_COOKIE, JSON.stringify(result), attrs);
	}
	function getPreview() {
	  const result = getCookie(PREVIEW_MODE_COOKIE);
	  if (isBlank(result)) {
	    return {};
	  }
	  try {
	    return JSON.parse(result);
	  } catch (e) {
	    return {};
	  }
	}
	function isPreviewMode() {
	  return previewActive;
	}

	function remove(selector) {
	  return select(selector).empty().remove();
	}
	function after(content, selector) {
	  return select(selector).after(content);
	}
	function before(content, selector) {
	  return select(selector).before(content);
	}
	function append(content, selector) {
	  return select(selector).append(content);
	}
	function prepend(content, selector) {
	  return select(selector).prepend(content);
	}
	function setHtml(content, selector) {
	  return select(selector).html(content);
	}
	function getHtml(selector) {
	  return select(selector).html();
	}
	function setText(content, selector) {
	  return select(selector).text(content);
	}

	const STYLE_PREFIX = "at-";
	const BODY_STYLE_ID = "at-body-style";
	const BODY_STYLE_ID_SELECTOR = "#" + BODY_STYLE_ID;
	const ALL_VIEWS_STYLE_ID = STYLE_PREFIX + "views";
	function createStyleMarkup(id, content) {
	  return "<" + STYLE_TAG + " " + ID + "=\"" + id + "\" " + CLASS + "=\"" + FLICKER_CONTROL_CLASS + "\">" + content + "</" + STYLE_TAG + ">";
	}
	function createActionStyle(styleDef, selector) {
	  const id = STYLE_PREFIX + hash(selector);
	  const style = selector + " {" + styleDef + "}";
	  return createStyleMarkup(id, style);
	}
	function createAllViewsStyle(styleDef, aggregateSelector) {
	  const style = aggregateSelector + " {" + styleDef + "}";
	  return createStyleMarkup(ALL_VIEWS_STYLE_ID, style);
	}
	function addHidingSnippet(config) {
	  const bodyHidingEnabled = config[BODY_HIDING_ENABLED];
	  if (bodyHidingEnabled !== true) {
	    return;
	  }
	  if (exists$2(BODY_STYLE_ID_SELECTOR)) {
	    return;
	  }
	  const bodyHiddenStyle = config[BODY_HIDDEN_STYLE];
	  append(createStyleMarkup(BODY_STYLE_ID, bodyHiddenStyle), HEAD_TAG);
	}
	function removeHidingSnippet(config) {
	  const bodyHidingEnabled = config[BODY_HIDING_ENABLED];
	  if (bodyHidingEnabled !== true) {
	    return;
	  }
	  if (!exists$2(BODY_STYLE_ID_SELECTOR)) {
	    return;
	  }
	  remove(BODY_STYLE_ID_SELECTOR);
	}
	function addActionHidings(config, selectors) {
	  if (isEmpty(selectors)) {
	    return;
	  }
	  const alreadyHidden = selector => !exists$2("#" + (STYLE_PREFIX + hash(selector)));
	  const selectorsToHide = filter(alreadyHidden, selectors);
	  if (isEmpty(selectorsToHide)) {
	    return;
	  }
	  const styleDef = config[DEFAULT_CONTENT_HIDDEN_STYLE];
	  const buildStyle = selector => createActionStyle(styleDef, selector);
	  const content = join("\n", map(buildStyle, selectorsToHide));
	  append(content, HEAD_TAG);
	}
	function addAllViewsHidings(config, selectors) {
	  if (isEmpty(selectors) || exists$2("#" + ALL_VIEWS_STYLE_ID)) {
	    return;
	  }
	  const styleDef = config[DEFAULT_CONTENT_HIDDEN_STYLE];
	  const aggregateSelector = join(", ", selectors);
	  const content = createAllViewsStyle(styleDef, aggregateSelector);
	  append(content, HEAD_TAG);
	}

	function injectHidingSnippetStyle() {
	  addHidingSnippet(getConfig());
	}
	function removeHidingSnippetStyle() {
	  removeHidingSnippet(getConfig());
	}
	function injectActionHidingStyles(selectors) {
	  addActionHidings(getConfig(), selectors);
	}
	function injectAllViewsHidingStyle(selectors) {
	  addAllViewsHidings(getConfig(), selectors);
	}
	function removeActionHidingStyle(selector) {
	  const id = STYLE_PREFIX + hash(selector);
	  remove("#" + id);
	}
	function removeAllViewsHidingStyle() {
	  const hidingStyleSelector = "#" + ALL_VIEWS_STYLE_ID;
	  if (exists$2(hidingStyleSelector)) {
	    remove(hidingStyleSelector);
	  }
	}

	const OPTOUT_MESSAGE = "Disabled due to optout";
	const MCAAMB = "MCAAMB";
	const MCAAMLH = "MCAAMLH";
	const MCMID = "MCMID";
	const MCOPTOUT = "MCOPTOUT";
	const SDID_METHOD = "getSupplementalDataID";
	const CIDS_METHOD = "getCustomerIDs";
	const SUPPORTS_NS = true;
	const NAMESPACE_TYPE = "NS";
	const DATASOURCE_TYPE = "DS";
	const TRACK_SERVER_PROP = "trackingServer";
	const TRACK_SERVER_SECURE_PROP = TRACK_SERVER_PROP + "Secure";
	function hasId(value) {
	  return !isNil(value[ID]);
	}
	function hasAuthState(value) {
	  return !isNil(value[AUTH_STATE]);
	}
	function getAuthenticatedState(value) {
	  switch (value) {
	    case 0:
	      return "unknown";
	    case 1:
	      return "authenticated";
	    case 2:
	      return "logged_out";
	    default:
	      return "unknown";
	  }
	}
	function isPrimary(value) {
	  return value[PRIMARY];
	}
	function isCustomerId(value) {
	  return hasId(value) || hasAuthState(value);
	}
	function normalizeCustomerIds(customerIds, customerIdType) {
	  return reduce((acc, value, key) => {
	    const item = {};
	    item[INTEGRATION_CODE] = key;
	    if (hasId(value)) {
	      item[ID] = value[ID];
	    }
	    if (hasAuthState(value)) {
	      item[AUTHENTICATED_STATE] = getAuthenticatedState(value[AUTH_STATE]);
	    }
	    item[TYPE] = customerIdType;
	    if (isPrimary(value)) {
	      item[PRIMARY] = true;
	    }
	    acc.push(item);
	    return acc;
	  }, [], filter(isCustomerId, customerIds));
	}
	function buildDeliveryCustomerIds(customerIds) {
	  if (!customerIds.nameSpaces && !customerIds.dataSources) {
	    return normalizeCustomerIds(customerIds, DATASOURCE_TYPE);
	  }
	  const normalizedCustomerIds = [];
	  if (customerIds.nameSpaces) {
	    normalizedCustomerIds.push.apply(normalizedCustomerIds, normalizeCustomerIds(customerIds.nameSpaces, NAMESPACE_TYPE));
	  }
	  if (customerIds.dataSources) {
	    normalizedCustomerIds.push.apply(normalizedCustomerIds, normalizeCustomerIds(customerIds.dataSources, DATASOURCE_TYPE));
	  }
	  return normalizedCustomerIds;
	}
	function getCustomerIds(visitor) {
	  if (isNil(visitor)) {
	    return [];
	  }
	  if (!isFunction(visitor[CIDS_METHOD])) {
	    return [];
	  }
	  const customerIds = visitor[CIDS_METHOD](SUPPORTS_NS);
	  if (!isObject(customerIds)) {
	    return [];
	  }
	  return buildDeliveryCustomerIds(customerIds);
	}
	function getSdid(visitor, consumerId) {
	  if (isNil(visitor)) {
	    return null;
	  }
	  if (!isFunction(visitor[SDID_METHOD])) {
	    return null;
	  }
	  return visitor[SDID_METHOD](consumerId);
	}
	function getInstanceProperty(visitor, property) {
	  if (isNil(visitor)) {
	    return null;
	  }
	  const result = visitor[property];
	  if (isNil(result)) {
	    return null;
	  }
	  return result;
	}

	const VISITOR = "Visitor";
	const GET_INSTANCE_METHOD = "getInstance";
	const IS_ALLOWED_METHOD = "isAllowed";
	function getInstance(win, imsOrgId, sdidParamExpiry) {
	  if (isBlank(imsOrgId)) {
	    return null;
	  }
	  if (isNil(win[VISITOR])) {
	    return null;
	  }
	  if (!isFunction(win[VISITOR][GET_INSTANCE_METHOD])) {
	    return null;
	  }
	  const visitor = win[VISITOR][GET_INSTANCE_METHOD](imsOrgId, {
	    sdidParamExpiry
	  });
	  if (isObject(visitor) && isFunction(visitor[IS_ALLOWED_METHOD]) && visitor[IS_ALLOWED_METHOD]()) {
	    return visitor;
	  }
	  return null;
	}

	const TIMEOUT_MESSAGE = "Visitor API requests timed out";
	const ERROR_MESSAGE = "Visitor API requests error";
	function getVisitorValuesAsync(visitor, optoutEnabled) {
	  if (!isFunction(visitor.getVisitorValues)) {
	    return resolve$1({});
	  }
	  const fields = [MCMID, MCAAMB, MCAAMLH];
	  if (optoutEnabled) {
	    fields.push(MCOPTOUT);
	  }
	  return create(res => {
	    visitor.getVisitorValues(values => res(values), fields);
	  });
	}
	function handleError(error) {
	  logDebug(ERROR_MESSAGE, error);
	  return {};
	}
	function getAsyncValues(visitor, visitorApiTimeout, optoutEnabled) {
	  if (isNil(visitor)) {
	    return resolve$1({});
	  }
	  const requests = getVisitorValuesAsync(visitor, optoutEnabled);
	  return timeout(requests, visitorApiTimeout, TIMEOUT_MESSAGE)['catch'](handleError);
	}

	function getVisitorValues(visitor, optoutEnabled) {
	  if (!isFunction(visitor.getVisitorValues)) {
	    return {};
	  }
	  const fields = [MCMID, MCAAMB, MCAAMLH];
	  if (optoutEnabled) {
	    fields.push(MCOPTOUT);
	  }
	  const result = {};
	  visitor.getVisitorValues(values => reactorObjectAssign(result, values), fields);
	  return result;
	}
	function getSyncValues(visitor, optoutEnabled) {
	  if (isNil(visitor)) {
	    return {};
	  }
	  return getVisitorValues(visitor, optoutEnabled);
	}

	function getVisitorInstance() {
	  const config = getConfig();
	  const imsOrgId = config[IMS_ORG_ID];
	  const sdidParamExpiry = config[SUPPLEMENTAL_DATA_ID_PARAM_TIMEOUT];
	  return getInstance(window, imsOrgId, sdidParamExpiry);
	}
	function getAsyncVisitorValues() {
	  const visitor = getVisitorInstance();
	  const config = getConfig();
	  const visitorApiTimeout = config[VISITOR_API_TIMEOUT];
	  const optoutEnabled = config[OPTOUT_ENABLED];
	  return getAsyncValues(visitor, visitorApiTimeout, optoutEnabled);
	}
	function getSyncVisitorValues() {
	  const visitor = getVisitorInstance();
	  const config = getConfig();
	  const optoutEnabled = config[OPTOUT_ENABLED];
	  return getSyncValues(visitor, optoutEnabled);
	}
	function getCustomerIdsVisitorValues() {
	  return getCustomerIds(getVisitorInstance());
	}
	function getSdidVisitorValue(consumerId) {
	  return getSdid(getVisitorInstance(), consumerId);
	}
	function getVisitorProperty(property) {
	  return getInstanceProperty(getVisitorInstance(), property);
	}

	const storage = {};
	function setItem(key, value) {
	  storage[key] = value;
	}
	function getItem(key) {
	  return storage[key];
	}

	const LOG_PREFIX = "Data provider";
	const TIMED_OUT = "timed out";
	const MAX_TIMEOUT = 2000;
	function areDataProvidersPresent(win) {
	  const globalSettings = win[GLOBAL_SETTINGS];
	  if (isNil(globalSettings)) {
	    return false;
	  }
	  const dataProviders = globalSettings[DATA_PROVIDERS];
	  if (!isArray(dataProviders) || isEmpty(dataProviders)) {
	    return false;
	  }
	  return true;
	}
	function isValidDataProvider(dataProvider) {
	  const name = dataProvider[NAME];
	  if (!isString(name) || isEmpty(name)) {
	    return false;
	  }
	  const version = dataProvider[VERSION];
	  if (!isString(version) || isEmpty(version)) {
	    return false;
	  }
	  const wait = dataProvider[TIMEOUT];
	  if (!isNil(wait) && !isNumber(wait)) {
	    return false;
	  }
	  const provider = dataProvider[PROVIDER];
	  if (!isFunction(provider)) {
	    return false;
	  }
	  return true;
	}
	function createPromise(provider) {
	  return create((success, error) => {
	    provider((err, params) => {
	      if (!isNil(err)) {
	        error(err);
	        return;
	      }
	      success(params);
	    });
	  });
	}
	function createTrace(nameKey, name, versionKey, version, resKey, res) {
	  const dataProviderTrace = {};
	  dataProviderTrace[nameKey] = name;
	  dataProviderTrace[versionKey] = version;
	  dataProviderTrace[resKey] = res;
	  const result = {};
	  result[DATA_PROVIDER] = dataProviderTrace;
	  return result;
	}
	function convertToPromise(dataProvider) {
	  const name = dataProvider[NAME];
	  const version = dataProvider[VERSION];
	  const wait = dataProvider[TIMEOUT] || MAX_TIMEOUT;
	  const provider = dataProvider[PROVIDER];
	  const promise = createPromise(provider);
	  return timeout(promise, wait, TIMED_OUT).then(params => {
	    const trace = createTrace(NAME, name, VERSION, version, PARAMS, params);
	    logDebug(LOG_PREFIX, SUCCESS, trace);
	    addClientTrace(trace);
	    return params;
	  })['catch'](error => {
	    const trace = createTrace(NAME, name, VERSION, version, ERROR, error);
	    logDebug(LOG_PREFIX, ERROR, trace);
	    addClientTrace(trace);
	    return {};
	  });
	}
	function collectParams(arr) {
	  const result = reduce((acc, value) => reactorObjectAssign(acc, value), {}, arr);
	  setItem(DATA_PROVIDERS, result);
	  return result;
	}
	function executeAsyncDataProviders(win) {
	  if (!areDataProvidersPresent(win)) {
	    return resolve$1({});
	  }
	  const dataProviders = win[GLOBAL_SETTINGS][DATA_PROVIDERS];
	  const validProviders = filter(isValidDataProvider, dataProviders);
	  return all(map(convertToPromise, validProviders)).then(collectParams);
	}
	function executeSyncDataProviders() {
	  const result = getItem(DATA_PROVIDERS);
	  if (isNil(result)) {
	    return {};
	  }
	  return result;
	}

	function getAsyncDataProvidersParameters() {
	  return executeAsyncDataProviders(window);
	}
	function getSyncDataProvidersParameters() {
	  return executeSyncDataProviders();
	}

	const TOKEN_PARAM = "authorization";
	const TOKEN_COOKIE = "mboxDebugTools";
	function getTokenFromQueryString(win) {
	  const {
	    location
	  } = win;
	  const {
	    search
	  } = location;
	  const params = parseQueryString(search);
	  const result = params[TOKEN_PARAM];
	  if (isBlank(result)) {
	    return null;
	  }
	  return result;
	}
	function getTokenFromCookie() {
	  const result = getCookie(TOKEN_COOKIE);
	  if (isBlank(result)) {
	    return null;
	  }
	  return result;
	}
	function getTraceToken() {
	  const param = getTokenFromQueryString(window);
	  const cookie = getTokenFromCookie();
	  return param || cookie;
	}

	function isPair(pair) {
	  return !isEmpty(pair) && pair.length === 2 && isNotBlank(pair[0]);
	}
	function createPair$1(param) {
	  const index = param.indexOf("=");
	  if (index === -1) {
	    return [];
	  }
	  return [param.substr(0, index), param.substr(index + 1)];
	}
	function objectToParamsInternal(obj, ks, result, keyFunc) {
	  forEach((value, key) => {
	    if (isObject(value)) {
	      ks.push(key);
	      objectToParamsInternal(value, ks, result, keyFunc);
	      ks.pop();
	    } else if (isEmpty(ks)) {
	      result[keyFunc(key)] = value;
	    } else {
	      result[keyFunc(join(".", ks.concat(key)))] = value;
	    }
	  }, obj);
	}
	function queryStringToParams(queryString) {
	  return filter((value, key) => isNotBlank(key), parseQueryString(queryString));
	}
	function arrayToParams(array) {
	  const pairs = reduce((acc, param) => {
	    acc.push(createPair$1(param));
	    return acc;
	  }, [], filter(isNotBlank, array));
	  return reduce((acc, pair) => {
	    acc[decode$1(trim(pair[0]))] = decode$1(trim(pair[1]));
	    return acc;
	  }, {}, filter(isPair, pairs));
	}
	function objectToParams(object, keyFunc) {
	  const result = {};
	  if (isNil(keyFunc)) {
	    objectToParamsInternal(object, [], result, identity);
	  } else {
	    objectToParamsInternal(object, [], result, keyFunc);
	  }
	  return result;
	}
	function functionToParams(func) {
	  if (!isFunction(func)) {
	    return {};
	  }
	  let params = null;
	  try {
	    params = func();
	  } catch (_ignore) {
	    return {};
	  }
	  if (isNil(params)) {
	    return {};
	  }
	  if (isArray(params)) {
	    return arrayToParams(params);
	  }
	  if (isString(params) && isNotBlank(params)) {
	    return queryStringToParams(params);
	  }
	  if (isObject(params)) {
	    return objectToParams(params);
	  }
	  return {};
	}

	function getParamsAll(mboxParams) {
	  return reactorObjectAssign({}, mboxParams, functionToParams(window.targetPageParamsAll));
	}
	function getParams(globalMboxParams) {
	  return reactorObjectAssign({}, globalMboxParams, functionToParams(window.targetPageParams));
	}
	function getTargetPageParams(mbox) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const mboxParams = config[MBOX_PARAMS];
	  const globalMboxParams = config[GLOBAL_MBOX_PARAMS];
	  if (globalMbox !== mbox) {
	    return getParamsAll(mboxParams || {});
	  }
	  return reactorObjectAssign(getParamsAll(mboxParams || {}), getParams(globalMboxParams || {}));
	}

	function getWebGLRendererInternal() {
	  const canvas = document.createElement("canvas");
	  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	  if (isNil(gl)) {
	    return null;
	  }
	  const glInfo = gl.getExtension("WEBGL_debug_renderer_info");
	  if (isNil(glInfo)) {
	    return null;
	  }
	  const result = gl.getParameter(glInfo.UNMASKED_RENDERER_WEBGL);
	  if (isNil(result)) {
	    return null;
	  }
	  return result;
	}
	const WEB_GL_RENDERER_INTERNAL = getWebGLRendererInternal();
	function getPixelRatio() {
	  let {
	    devicePixelRatio: ratio
	  } = window;
	  if (!isNil(ratio)) {
	    return ratio;
	  }
	  ratio = 1;
	  const {
	    screen
	  } = window;
	  const {
	    systemXDPI,
	    logicalXDPI
	  } = screen;
	  if (!isNil(systemXDPI) && !isNil(logicalXDPI) && systemXDPI > logicalXDPI) {
	    ratio = systemXDPI / logicalXDPI;
	  }
	  return ratio;
	}
	function getScreenOrientation() {
	  const {
	    screen
	  } = window;
	  const {
	    orientation,
	    width,
	    height
	  } = screen;
	  if (isNil(orientation)) {
	    return width > height ? "landscape" : "portrait";
	  }
	  if (isNil(orientation.type)) {
	    return null;
	  }
	  const parts = split("-", orientation.type);
	  if (isEmpty(parts)) {
	    return null;
	  }
	  const result = parts[0];
	  if (!isNil(result)) {
	    return result;
	  }
	  return null;
	}
	function getWebGLRenderer() {
	  return WEB_GL_RENDERER_INTERNAL;
	}

	const PROFILE_PREFIX = "profile.";
	const THIRD_PARTY_ID = "mbox3rdPartyId";
	const PROPERTY_TOKEN = "at_property";
	const ORDER_ID = "orderId";
	const ORDER_TOTAL = "orderTotal";
	const PRODUCT_PURCHASED_ID = "productPurchasedId";
	const PRODUCT_ID = "productId";
	const CATEGORY_ID = "categoryId";
	function isThirdPartyId(param) {
	  return param === THIRD_PARTY_ID;
	}
	function isProfileParam(param) {
	  return param.indexOf(PROFILE_PREFIX) !== -1;
	}
	function isPropertyToken(param) {
	  return param === PROPERTY_TOKEN;
	}
	function isOrderId(param) {
	  return param === ORDER_ID;
	}
	function isOrderTotal(param) {
	  return param === ORDER_TOTAL;
	}
	function isProductPurchasedId(param) {
	  return param === PRODUCT_PURCHASED_ID;
	}
	function isProductId(param) {
	  return param === PRODUCT_ID;
	}
	function isCategoryId(param) {
	  return param === CATEGORY_ID;
	}
	function isSpecialParam(param) {
	  return isProfileParam(param) || isThirdPartyId(param) || isPropertyToken(param) || isOrderId(param) || isOrderTotal(param) || isProductPurchasedId(param) || isProductId(param) || isCategoryId(param);
	}
	function extractProfileParam(param) {
	  return param.substring(PROFILE_PREFIX.length);
	}
	function getThirdPartyId(parameters) {
	  return parameters[THIRD_PARTY_ID];
	}
	function getPropertyToken$1(params) {
	  return params[PROPERTY_TOKEN];
	}
	function getOrderId(params) {
	  return params[ORDER_ID];
	}
	function getOrderTotal(params) {
	  return params[ORDER_TOTAL];
	}
	function getPurchasedProductIds(params) {
	  const value = params[PRODUCT_PURCHASED_ID];
	  const result = map(trim, split(",", value));
	  return filter(isNotBlank, result);
	}
	function getProductId(params) {
	  return params[PRODUCT_ID];
	}
	function getCategoryId(params) {
	  return params[CATEGORY_ID];
	}
	function getParams$1(params) {
	  return reduce((acc, value, key) => {
	    if (isSpecialParam(key)) {
	      return acc;
	    }
	    acc[key] = isNil(value) ? "" : value;
	    return acc;
	  }, {}, params);
	}
	function getProfileParams(params) {
	  return reduce((acc, value, key) => {
	    if (!isProfileParam(key)) {
	      return acc;
	    }
	    const profileKey = extractProfileParam(key);
	    if (isBlank(profileKey)) {
	      return acc;
	    }
	    acc[profileKey] = isNil(value) ? "" : value;
	    return acc;
	  }, {}, params);
	}

	const POST = "POST";
	const NETWORK_ERROR = "Network request failed";
	const REQUEST_TIMEOUT = "Request timed out";
	const MALFORMED_RESPONSE = "Malformed response JSON";
	function addOnload(xhr, resolve, reject) {
	  xhr.onload = () => {
	    const status = xhr.status === 1223 ? 204 : xhr.status;
	    if (status < 100 || status > 599) {
	      reject(new Error(NETWORK_ERROR));
	      return;
	    }
	    let response;
	    try {
	      response = JSON.parse(xhr.responseText);
	    } catch (e) {
	      reject(new Error(MALFORMED_RESPONSE));
	      return;
	    }
	    const headers = xhr.getAllResponseHeaders();
	    resolve({
	      status,
	      headers,
	      response
	    });
	  };
	  return xhr;
	}
	function addOnerror(xhr, reject) {
	  xhr.onerror = () => {
	    reject(new Error(NETWORK_ERROR));
	  };
	  return xhr;
	}
	function addOntimeout(xhr, timeout, reject) {
	  xhr.timeout = timeout;
	  xhr.ontimeout = () => {
	    reject(new Error(REQUEST_TIMEOUT));
	  };
	  return xhr;
	}
	function addHeaders(xhr, headers = {}) {
	  forEach((values, key) => {
	    if (!isArray(values)) {
	      return;
	    }
	    forEach(value => {
	      xhr.setRequestHeader(key, value);
	    }, values);
	  }, headers);
	  return xhr;
	}
	function executeXhr({
	  url,
	  headers,
	  body,
	  timeout,
	  async
	}) {
	  return create((resolve, reject) => {
	    let xhr = new window.XMLHttpRequest();
	    xhr = addOnload(xhr, resolve, reject);
	    xhr = addOnerror(xhr, reject);
	    xhr.open(POST, url, async);
	    xhr.withCredentials = true;
	    xhr = addHeaders(xhr, headers);
	    if (async) {
	      xhr = addOntimeout(xhr, timeout, reject);
	    }
	    xhr.send(JSON.stringify(body));
	  }).then(xhrResponse => {
	    const {
	      response
	    } = xhrResponse;
	    const {
	      status,
	      message
	    } = response;
	    if (!isNil(status) && !isNil(message)) {
	      throw new Error(message);
	    }
	    return response;
	  });
	}

	const EDGE_SERVER_PREFIX = "mboxedge";
	const EDGE_SERVER_DOMAIN = ".tt.omtrdc.net";
	const notEmpty = val => !isEmpty(val);
	function throwIfOptout(values) {
	  const optout = values[MCOPTOUT];
	  if (optout) {
	    throw new Error(OPTOUT_MESSAGE);
	  }
	  return values;
	}
	function getAsyncThirdPartyData() {
	  const visitorValues = getAsyncVisitorValues();
	  const dataProvidersParams = getAsyncDataProvidersParameters();
	  return all([visitorValues.then(throwIfOptout), dataProvidersParams]);
	}
	function getSyncThirdPartyData() {
	  const visitorValues = getSyncVisitorValues();
	  const dataProvidersParams = getSyncDataProvidersParameters();
	  return [visitorValues, dataProvidersParams];
	}
	function getAllParams(providersParams) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  return reactorObjectAssign({}, providersParams, getTargetPageParams(globalMbox));
	}
	function getTimeOffset() {
	  return -new Date().getTimezoneOffset();
	}
	function createScreen() {
	  const {
	    screen
	  } = window;
	  return {
	    width: screen.width,
	    height: screen.height,
	    orientation: getScreenOrientation(),
	    colorDepth: screen.colorDepth,
	    pixelRatio: getPixelRatio()
	  };
	}
	function createWindow() {
	  const {
	    documentElement
	  } = document;
	  return {
	    width: documentElement.clientWidth,
	    height: documentElement.clientHeight
	  };
	}
	function createBrowser() {
	  const {
	    location
	  } = window;
	  return {
	    host: location.hostname,
	    webGLRenderer: getWebGLRenderer()
	  };
	}
	function createAddress() {
	  const {
	    location
	  } = window;
	  return {
	    url: location.href,
	    referringUrl: document.referrer
	  };
	}
	function createContext(context) {
	  if (!isNil(context) && context.channel === WEB_CHANNEL) {
	    return context;
	  }
	  const validContext = context || {};
	  const {
	    beacon
	  } = validContext;
	  return {
	    userAgent: window.navigator.userAgent,
	    timeOffsetInMinutes: getTimeOffset(),
	    channel: WEB_CHANNEL,
	    screen: createScreen(),
	    window: createWindow(),
	    browser: createBrowser(),
	    address: createAddress(),
	    geo: context && context.geo,
	    beacon
	  };
	}
	function createAudienceManager(audienceManager, visitorValues) {
	  if (!isNil(audienceManager)) {
	    return audienceManager;
	  }
	  const result = {};
	  if (isEmpty(visitorValues)) {
	    return result;
	  }
	  const locationHint = visitorValues[MCAAMLH];
	  const locationHintNumber = parseInt(locationHint, 10);
	  if (!isNaN(locationHintNumber)) {
	    result.locationHint = locationHintNumber;
	  }
	  const blob = visitorValues[MCAAMB];
	  if (isNotBlank(blob)) {
	    result.blob = blob;
	  }
	  return result;
	}
	function createCustomerId(data) {
	  const {
	    id,
	    integrationCode,
	    authenticatedState,
	    type,
	    primary
	  } = data;
	  const result = {};
	  if (isNotBlank(id)) {
	    result.id = id;
	  }
	  if (isNotBlank(integrationCode)) {
	    result.integrationCode = integrationCode;
	  }
	  if (isNotBlank(authenticatedState)) {
	    result.authenticatedState = authenticatedState;
	  }
	  if (isNotBlank(type)) {
	    result.type = type;
	  }
	  if (primary) {
	    result.primary = primary;
	  }
	  return result;
	}
	function createCustomerIds(customerIdsValues) {
	  return map(createCustomerId, customerIdsValues);
	}
	function createVisitorId(id, deviceId, thirdPartyId, visitorValues, customerIdsValues) {
	  const result = {};
	  if (isNotBlank(deviceId)) {
	    result.tntId = deviceId;
	  }
	  if (isNotBlank(thirdPartyId)) {
	    result.thirdPartyId = thirdPartyId;
	  }
	  if (isNotBlank(id.thirdPartyId)) {
	    result.thirdPartyId = id.thirdPartyId;
	  }
	  const mid = visitorValues[MCMID];
	  if (isNotBlank(mid)) {
	    result.marketingCloudVisitorId = mid;
	  }
	  if (isNotBlank(id.marketingCloudVisitorId)) {
	    result.marketingCloudVisitorId = id.marketingCloudVisitorId;
	  }
	  if (!isEmpty(id.customerIds)) {
	    result.customerIds = id.customerIds;
	    return result;
	  }
	  if (!isEmpty(customerIdsValues)) {
	    result.customerIds = createCustomerIds(customerIdsValues);
	  }
	  return result;
	}
	function createExperienceCloud(experienceCloud, visitorValues) {
	  const result = {};
	  const audienceManager = createAudienceManager(experienceCloud.audienceManager, visitorValues);
	  if (!isEmpty(audienceManager)) {
	    result.audienceManager = audienceManager;
	  }
	  if (!isEmpty(experienceCloud.analytics)) {
	    result.analytics = experienceCloud.analytics;
	  }
	  return result;
	}
	function createProperty(property, allParams) {
	  if (!isNil(property) && isNotBlank(property.token)) {
	    return property;
	  }
	  const result = {};
	  const token = getPropertyToken$1(allParams);
	  if (isNotBlank(token)) {
	    result.token = token;
	  }
	  return result;
	}
	function createTrace$1(trace) {
	  if (!isNil(trace) && isNotBlank(trace.authorizationToken)) {
	    return trace;
	  }
	  const result = {};
	  const authorizationToken = getTraceToken();
	  if (isNotBlank(authorizationToken)) {
	    result.authorizationToken = authorizationToken;
	  }
	  return result;
	}
	function createPreview(preview) {
	  if (!isNil(preview)) {
	    return preview;
	  }
	  return getPreview();
	}
	function createQaMode(qaMode) {
	  if (!isNil(qaMode)) {
	    return qaMode;
	  }
	  return getQaMode();
	}
	function createOrder(params) {
	  const result = {};
	  const orderId = getOrderId(params);
	  if (!isNil(orderId)) {
	    result.id = orderId;
	  }
	  const orderTotal = getOrderTotal(params);
	  const orderTotalNumber = parseFloat(orderTotal);
	  if (!isNaN(orderTotalNumber)) {
	    result.total = orderTotalNumber;
	  }
	  const purchasedProductIds = getPurchasedProductIds(params);
	  if (!isEmpty(purchasedProductIds)) {
	    result.purchasedProductIds = purchasedProductIds;
	  }
	  return result;
	}
	function createProduct(params) {
	  const result = {};
	  const productId = getProductId(params);
	  if (!isNil(productId)) {
	    result.id = productId;
	  }
	  const categoryId = getCategoryId(params);
	  if (!isNil(categoryId)) {
	    result.categoryId = categoryId;
	  }
	  return result;
	}
	function createRequestDetails(item, allParams) {
	  const result = {};
	  const params = reactorObjectAssign({}, getParams$1(allParams), item.parameters || {});
	  const profileParams = reactorObjectAssign({}, getProfileParams(allParams), item.profileParameters || {});
	  const order = reactorObjectAssign({}, createOrder(allParams), item.order || {});
	  const product = reactorObjectAssign({}, createProduct(allParams), item.product || {});
	  if (!isEmpty(params)) {
	    result.parameters = params;
	  }
	  if (!isEmpty(profileParams)) {
	    result.profileParameters = profileParams;
	  }
	  if (!isEmpty(order)) {
	    result.order = order;
	  }
	  if (!isEmpty(product)) {
	    result.product = product;
	  }
	  return result;
	}
	function createMboxRequestDetails(item, allParams, providersParams = {}) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const {
	    index,
	    name,
	    address
	  } = item;
	  const params = reactorObjectAssign({}, name === globalMbox ? allParams : providersParams, getTargetPageParams(name));
	  const result = createRequestDetails(item, params);
	  if (!isNil(index)) {
	    result.index = index;
	  }
	  if (isNotBlank(name)) {
	    result.name = name;
	  }
	  if (!isEmpty(address)) {
	    result.address = address;
	  }
	  return result;
	}
	function createViewRequestDetails(item, allParams) {
	  const {
	    name,
	    address
	  } = item;
	  const result = createRequestDetails(item, allParams);
	  if (isNotBlank(name)) {
	    result.name = name;
	  }
	  if (!isEmpty(address)) {
	    result.address = address;
	  }
	  return result;
	}
	function createExecute(request, allParams, providersParams) {
	  const {
	    execute = {}
	  } = request;
	  const result = {};
	  if (isEmpty(execute)) {
	    return result;
	  }
	  const {
	    pageLoad
	  } = execute;
	  if (!isNil(pageLoad)) {
	    result.pageLoad = createRequestDetails(pageLoad, allParams);
	  }
	  const {
	    mboxes
	  } = execute;
	  if (!isNil(mboxes) && isArray(mboxes) && !isEmpty(mboxes)) {
	    const temp = filter(notEmpty, map(e => createMboxRequestDetails(e, allParams, providersParams), mboxes));
	    if (!isEmpty(temp)) {
	      result.mboxes = temp;
	    }
	  }
	  return result;
	}
	function createPrefetch(request, allParams, providersParams) {
	  const {
	    prefetch = {}
	  } = request;
	  const result = {};
	  if (isEmpty(prefetch)) {
	    return result;
	  }
	  const {
	    mboxes
	  } = prefetch;
	  if (!isNil(mboxes) && isArray(mboxes) && !isEmpty(mboxes)) {
	    result.mboxes = map(e => createMboxRequestDetails(e, allParams, providersParams), mboxes);
	  }
	  const {
	    views
	  } = prefetch;
	  if (!isNil(views) && isArray(views) && !isEmpty(views)) {
	    result.views = map(e => createViewRequestDetails(e, allParams), views);
	  }
	  return result;
	}
	function createAnalytics(consumerId, request) {
	  if (shouldUseOptin() && !isAnalyticsApproved()) {
	    return null;
	  }
	  const config = getConfig();
	  const sdid = getSdidVisitorValue(consumerId);
	  const server = getVisitorProperty(TRACK_SERVER_PROP);
	  const serverSecure = getVisitorProperty(TRACK_SERVER_SECURE_PROP);
	  const {
	    experienceCloud = {}
	  } = request;
	  const {
	    analytics = {}
	  } = experienceCloud;
	  const {
	    logging,
	    supplementalDataId,
	    trackingServer,
	    trackingServerSecure
	  } = analytics;
	  const result = {};
	  if (!isNil(logging)) {
	    result.logging = logging;
	  } else {
	    result.logging = config[ANALYTICS_LOGGING];
	  }
	  if (!isNil(supplementalDataId)) {
	    result.supplementalDataId = supplementalDataId;
	  }
	  if (isNotBlank(sdid)) {
	    result.supplementalDataId = sdid;
	  }
	  if (!isNil(trackingServer)) {
	    result.trackingServer = trackingServer;
	  }
	  if (isNotBlank(server)) {
	    result.trackingServer = server;
	  }
	  if (!isNil(trackingServerSecure)) {
	    result.trackingServerSecure = trackingServerSecure;
	  }
	  if (isNotBlank(serverSecure)) {
	    result.trackingServerSecure = serverSecure;
	  }
	  if (isEmpty(result)) {
	    return null;
	  }
	  return result;
	}
	function createDeliveryRequest(request, visitorValues, providersParams) {
	  const allParams = getAllParams(providersParams);
	  const deviceId = getDeviceId();
	  const thirdPartyId = getThirdPartyId(allParams);
	  const customerIdsValues = getCustomerIdsVisitorValues();
	  const visitorId = createVisitorId(request.id || {}, deviceId, thirdPartyId, visitorValues, customerIdsValues);
	  const property = createProperty(request.property, allParams);
	  const experienceCloud = createExperienceCloud(request.experienceCloud || {}, visitorValues);
	  const trace = createTrace$1(request.trace);
	  const preview = createPreview(request.preview);
	  const qaMode = createQaMode(request.qaMode);
	  const execute = createExecute(request, allParams, providersParams);
	  const prefetch = createPrefetch(request, allParams, providersParams);
	  const {
	    notifications
	  } = request;
	  const result = {};
	  result.requestId = uuid();
	  result.context = createContext(request.context);
	  if (!isEmpty(visitorId)) {
	    result.id = visitorId;
	  }
	  if (!isEmpty(property)) {
	    result.property = property;
	  }
	  if (!isEmpty(trace)) {
	    result.trace = trace;
	  }
	  if (!isEmpty(experienceCloud)) {
	    result.experienceCloud = experienceCloud;
	  }
	  if (!isEmpty(preview)) {
	    result.preview = preview;
	  }
	  if (!isEmpty(qaMode)) {
	    result.qaMode = qaMode;
	  }
	  if (!isEmpty(execute)) {
	    result.execute = execute;
	  }
	  if (!isEmpty(prefetch)) {
	    result.prefetch = prefetch;
	  }
	  if (!isEmpty(notifications)) {
	    result.notifications = notifications;
	  }
	  return result;
	}
	function buildRequest(request, params, data) {
	  const visitorValues = data[0];
	  const providersValues = data[1];
	  const providersParams = reactorObjectAssign({}, providersValues, params);
	  return createDeliveryRequest(request, visitorValues, providersParams);
	}
	function createAsyncDeliveryRequest(request, params) {
	  return getAsyncThirdPartyData().then(data => buildRequest(request, params, data));
	}
	function createSyncDeliveryRequest(request, params) {
	  const data = getSyncThirdPartyData();
	  return buildRequest(request, params, data);
	}
	function getTimeout(config, timeout) {
	  if (!isNumber(timeout)) {
	    return config[TIMEOUT];
	  }
	  if (timeout < 0) {
	    return config[TIMEOUT];
	  }
	  return timeout;
	}
	function getServerDomain(config) {
	  const serverDomain = config[SERVER_DOMAIN];
	  const overrideMboxEdgeServer = config[OVERRIDE_MBOX_EDGE_SERVER];
	  if (!overrideMboxEdgeServer) {
	    return serverDomain;
	  }
	  const cluster = getEdgeCluster();
	  if (isBlank(cluster)) {
	    return serverDomain;
	  }
	  return "" + EDGE_SERVER_PREFIX + cluster + EDGE_SERVER_DOMAIN;
	}
	function createRequestUrl(config) {
	  const scheme = config[SCHEME];
	  const host = getServerDomain(config);
	  const path = config[ENDPOINT];
	  const client = config[CLIENT_CODE];
	  const sessionId = getSessionId();
	  const version = config[VERSION];
	  const queryString = stringifyQueryString({
	    client,
	    sessionId,
	    version
	  });
	  return scheme + "//" + host + path + "?" + queryString;
	}
	function executeDeliveryRequest(request, requestTimeout) {
	  const config = getConfig();
	  const url = createRequestUrl(config);
	  const headers = {
	    [CONTENT_TYPE]: [TEXT_PLAIN]
	  };
	  const timeout = getTimeout(config, requestTimeout);
	  const async = true;
	  const options = {
	    url,
	    headers,
	    body: request,
	    timeout,
	    async
	  };
	  return executeXhr(options).then(response => {
	    return reactorObjectAssign(response, {
	      decisioningMethod: DECISIONING_METHOD.SERVER_SIDE
	    });
	  });
	}
	function executeRequest(options, request, requestTimeout) {
	  logDebug(REQUEST, request);
	  addClientTrace({
	    request
	  });
	  return executeDeliveryRequest(request, requestTimeout).then(response => {
	    logDebug(RESPONSE, response);
	    addClientTrace({
	      response
	    });
	    return {
	      request,
	      response
	    };
	  });
	}

	const prop = key => obj => obj[key];
	const not = pred => val => !pred(val);
	const notNil = not(isNil);
	const notBlank = not(isBlank);
	const filterBy = pred => coll => filter(pred, coll);
	const isError = val => val.status === ERROR;
	const isActions = val => val.type === ACTIONS;
	const isRedirect = val => val.type === REDIRECT;
	const filterNotNil = filterBy(notNil);
	const filterNotBlank = filterBy(notBlank);
	const selectOptions = prop(OPTIONS);
	const selectContent = prop(CONTENT);
	const selectEventToken = prop(EVENT_TOKEN);
	const selectResponseTokens = prop(RESPONSE_TOKENS);
	const hasName = val => isNotBlank(val.name);
	const hasIndex = val => !isNil(val.index);
	const isValidMbox = val => isObject(val) && hasName(val);
	const isValidPrefetchMbox = val => isObject(val) && hasName(val) && hasIndex(val);
	const isValidView = val => isObject(val) && hasName(val);
	const hasSelector = val => isNotBlank(val.selector);
	const selectData = prop(DATA);
	const hasData = flow([selectData, notNil]);
	function createSuccess(type, data) {
	  return {
	    status: SUCCESS,
	    type,
	    data
	  };
	}
	function createError(type, data) {
	  return {
	    status: ERROR,
	    type,
	    data
	  };
	}
	function isValidOption(option) {
	  return isObject(option);
	}
	function isValidOptionEventToken(option) {
	  if (!isValidOption(option)) {
	    return false;
	  }
	  return isNotBlank(option.eventToken);
	}
	function isValidMetric(metric) {
	  if (isEmpty(metric) || isBlank(metric.type)) {
	    return false;
	  }
	  return isNotBlank(metric.eventToken);
	}
	function isValidSelectorMetric(metric) {
	  if (!isValidMetric(metric)) {
	    return false;
	  }
	  return isNotBlank(metric.selector);
	}
	function isErrorWithMessage(err, msg) {
	  return err instanceof Error && err.message === msg;
	}

	function hasDeviceId(res) {
	  const {
	    id
	  } = res;
	  return isObject(id) && isNotBlank(id.tntId);
	}
	function handleDeviceId(context) {
	  const {
	    response
	  } = context;
	  if (hasDeviceId(response)) {
	    setDeviceId(response.id.tntId);
	  }
	  return context;
	}

	function handleEdgeCluster(context) {
	  const {
	    response
	  } = context;
	  if (hasDeviceId(response)) {
	    const {
	      id
	    } = response;
	    const {
	      tntId
	    } = id;
	    setEdgeCluster(tntId);
	  }
	  setEdgeCluster(null);
	  return context;
	}

	function addTraceIfExists(item = {}) {
	  const {
	    trace
	  } = item;
	  if (!isEmpty(trace)) {
	    addServerTrace(trace);
	  }
	}
	function handleTraces(httpContext) {
	  const {
	    response
	  } = httpContext;
	  const {
	    execute = {},
	    prefetch = {},
	    notifications = {}
	  } = response;
	  const {
	    pageLoad = {},
	    mboxes = []
	  } = execute;
	  const {
	    mboxes: prefetchMboxes = [],
	    views = []
	  } = prefetch;
	  addTraceIfExists(pageLoad);
	  forEach(addTraceIfExists, mboxes);
	  forEach(addTraceIfExists, prefetchMboxes);
	  forEach(addTraceIfExists, views);
	  forEach(addTraceIfExists, notifications);
	  return httpContext;
	}

	const SDID_PARAM = "adobe_mc_sdid";
	function getRedirectUriParams(uri) {
	  const result = uri.queryKey;
	  const param = result[SDID_PARAM];
	  if (!isString(param)) {
	    return result;
	  }
	  if (isBlank(param)) {
	    return result;
	  }
	  const nowInSeconds = Math.round(now() / 1000);
	  result[SDID_PARAM] = param.replace(/\|TS=\d+/, "|TS=" + nowInSeconds);
	  return result;
	}
	function getUriParams(uri) {
	  return uri.queryKey;
	}
	function createUrlInternal(url, params, uriParamsFunc) {
	  const parsedUri = parseUri$1(url);
	  const {
	    protocol
	  } = parsedUri;
	  const {
	    host
	  } = parsedUri;
	  const {
	    path
	  } = parsedUri;
	  const port = parsedUri.port === "" ? "" : ":" + parsedUri.port;
	  const anchor = isBlank(parsedUri.anchor) ? "" : "#" + parsedUri.anchor;
	  const uriParams = uriParamsFunc(parsedUri);
	  const queryString = stringifyQueryString(reactorObjectAssign({}, uriParams, params));
	  const query = isBlank(queryString) ? "" : "?" + queryString;
	  return protocol + "://" + host + port + path + query + anchor;
	}
	function createRedirectUrl(url, params) {
	  return createUrlInternal(url, params, getRedirectUriParams);
	}
	function createUrl(url, params) {
	  return createUrlInternal(url, params, getUriParams);
	}

	function createRedirectOption(option) {
	  const url = option.content;
	  if (isBlank(url)) {
	    logDebug(EMPTY_URL, option);
	    return null;
	  }
	  const result = reactorObjectAssign({}, option);
	  result.content = createRedirectUrl(url, {});
	  return result;
	}

	const NETWORK_ERROR$1 = "Network request failed";
	const REQUEST_TIMEOUT$1 = "Request timed out";
	const URL_REQUIRED = "URL is required";
	const GET = "GET";
	const POST$1 = "POST";
	const METHOD = "method";
	const URL = "url";
	const HEADERS = "headers";
	const DATA$1 = "data";
	const CREDENTIALS = "credentials";
	const TIMEOUT$1 = "timeout";
	const ASYNC = "async";
	function throwError(message) {
	  throw new Error(message);
	}
	function processOptions(options) {
	  const method = options[METHOD] || GET;
	  const url = options[URL] || throwError(URL_REQUIRED);
	  const headers = options[HEADERS] || {};
	  const data = options[DATA$1] || null;
	  const credentials = options[CREDENTIALS] || false;
	  const timeout = options[TIMEOUT$1] || 3000;
	  const async = isNil(options[ASYNC]) ? true : options[ASYNC] === true;
	  const result = {};
	  result[METHOD] = method;
	  result[URL] = url;
	  result[HEADERS] = headers;
	  result[DATA$1] = data;
	  result[CREDENTIALS] = credentials;
	  result[TIMEOUT$1] = timeout;
	  result[ASYNC] = async;
	  return result;
	}
	function addOnload$1(xhr, resolve, reject) {
	  xhr.onload = () => {
	    const status = xhr.status === 1223 ? 204 : xhr.status;
	    if (status < 100 || status > 599) {
	      reject(new Error(NETWORK_ERROR$1));
	      return;
	    }
	    const response = xhr.responseText;
	    const headers = xhr.getAllResponseHeaders();
	    const result = {
	      status,
	      headers,
	      response
	    };
	    resolve(result);
	  };
	  return xhr;
	}
	function addOnerror$1(xhr, reject) {
	  xhr.onerror = () => {
	    reject(new Error(NETWORK_ERROR$1));
	  };
	  return xhr;
	}
	function addOntimeout$1(xhr, timeout, reject) {
	  xhr.timeout = timeout;
	  xhr.ontimeout = () => {
	    reject(new Error(REQUEST_TIMEOUT$1));
	  };
	  return xhr;
	}
	function addCredentials(xhr, credentials) {
	  if (credentials === true) {
	    xhr.withCredentials = credentials;
	  }
	  return xhr;
	}
	function addHeaders$1(xhr, headers) {
	  forEach((value, key) => {
	    forEach(v => xhr.setRequestHeader(key, v), value);
	  }, headers);
	  return xhr;
	}
	function createXhrPromise(win, opts) {
	  const options = processOptions(opts);
	  const method = options[METHOD];
	  const url = options[URL];
	  const headers = options[HEADERS];
	  const data = options[DATA$1];
	  const credentials = options[CREDENTIALS];
	  const timeout = options[TIMEOUT$1];
	  const async = options[ASYNC];
	  return create((resolve, reject) => {
	    let xhr = new win.XMLHttpRequest();
	    xhr = addOnload$1(xhr, resolve, reject);
	    xhr = addOnerror$1(xhr, reject);
	    xhr.open(method, url, async);
	    xhr = addCredentials(xhr, credentials);
	    xhr = addHeaders$1(xhr, headers);
	    if (async) {
	      xhr = addOntimeout$1(xhr, timeout, reject);
	    }
	    xhr.send(data);
	  });
	}

	function xhr(options) {
	  return createXhrPromise(window, options);
	}

	function createOptions(url, params, timeout) {
	  const result = {};
	  result[METHOD] = GET;
	  result[URL] = createUrl(url, params);
	  result[TIMEOUT$1] = timeout;
	  return result;
	}
	function isSuccess(status) {
	  return status >= 200 && status < 300 || status === 304;
	}
	function createOption(res) {
	  const {
	    status
	  } = res;
	  if (!isSuccess(status)) {
	    return null;
	  }
	  const content = res.response;
	  if (isBlank(content)) {
	    return null;
	  }
	  const result = {};
	  result.type = HTML;
	  result.content = content;
	  return result;
	}
	function createHtmlOption(option) {
	  const {
	    content
	  } = option;
	  const config = getConfig();
	  const timeout = config[TIMEOUT$1];
	  return xhr(createOptions(content, {}, timeout)).then(createOption)['catch'](() => null);
	}

	const CLICK_TRACK_PATTERN = /CLKTRK#(\S+)/;
	const CLICK_TRACK_REPLACE_PATTERN = /CLKTRK#(\S+)\s/;
	function getClickTrackNodeId(action) {
	  const selector = action[SELECTOR];
	  if (isBlank(selector)) {
	    return "";
	  }
	  const result = CLICK_TRACK_PATTERN.exec(selector);
	  if (isEmpty(result) || result.length !== 2) {
	    return "";
	  }
	  return result[1];
	}
	function getContent(id, content) {
	  const div = document.createElement(DIV_TAG);
	  div.innerHTML = content;
	  const firstElement = div.firstElementChild;
	  if (isNil(firstElement)) {
	    return content;
	  }
	  firstElement.id = id;
	  return firstElement.outerHTML;
	}
	function processClickTrackId(action) {
	  const content = action[CONTENT];
	  const nodeId = getClickTrackNodeId(action);
	  if (isBlank(nodeId) || isBlank(content)) {
	    return action;
	  }
	  const selector = action[SELECTOR];
	  action[SELECTOR] = selector.replace(CLICK_TRACK_REPLACE_PATTERN, "");
	  action[CONTENT] = getContent(nodeId, content);
	  return action;
	}

	const notNull$1 = val => !isNil(val);
	function hasSelector$1(action) {
	  const {
	    selector
	  } = action;
	  return !isNil(selector);
	}
	function setHtml$1(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const result = processClickTrackId(action);
	  const content = result[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, result);
	    return null;
	  }
	  return result;
	}
	function setText$1(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const result = processClickTrackId(action);
	  const content = result[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, result);
	    return null;
	  }
	  return result;
	}
	function appendHtml(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const result = processClickTrackId(action);
	  const content = result[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, result);
	    return null;
	  }
	  return result;
	}
	function prependHtml(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const result = processClickTrackId(action);
	  const content = result[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, result);
	    return null;
	  }
	  return result;
	}
	function replaceHtml(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const result = processClickTrackId(action);
	  const content = result[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, result);
	    return null;
	  }
	  return result;
	}
	function insertBefore(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const result = processClickTrackId(action);
	  const content = result[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, result);
	    return null;
	  }
	  return result;
	}
	function insertAfter(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const result = processClickTrackId(action);
	  const content = result[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, result);
	    return null;
	  }
	  return result;
	}
	function customCode(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const content = action[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_CONTENT, action);
	    return null;
	  }
	  return action;
	}
	function setAttribute(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const content = action[CONTENT];
	  if (!isObject(content)) {
	    logDebug(EMPTY_ATTRIBUTE, action);
	    return null;
	  }
	  return action;
	}
	function setImageSource(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const content = action[CONTENT];
	  if (!isString(content)) {
	    logDebug(EMPTY_IMAGE_URL, action);
	    return null;
	  }
	  return action;
	}
	function setStyle(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const content = action[CONTENT];
	  if (!isObject(content)) {
	    logDebug(EMPTY_PROPERTY, action);
	    return null;
	  }
	  return action;
	}
	function resize(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const content = action[CONTENT];
	  if (!isObject(content)) {
	    logDebug(EMPTY_SIZES, action);
	    return null;
	  }
	  return action;
	}
	function move(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const content = action[CONTENT];
	  if (!isObject(content)) {
	    logDebug(EMPTY_COORDINATES, action);
	    return null;
	  }
	  return action;
	}
	function remove$1(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  return action;
	}
	function rearrange(action) {
	  if (!hasSelector$1(action)) {
	    return null;
	  }
	  const content = action[CONTENT];
	  if (!isObject(content)) {
	    logDebug(EMPTY_REARRANGE, action);
	    return null;
	  }
	  return action;
	}
	function redirect(action) {
	  const {
	    content
	  } = action;
	  if (isBlank(content)) {
	    logDebug(EMPTY_URL, action);
	    return null;
	  }
	  action.content = createRedirectUrl(content, {});
	  return action;
	}
	function processAction(action) {
	  const type = action[TYPE];
	  if (isBlank(type)) {
	    return null;
	  }
	  switch (type) {
	    case SET_HTML:
	      return setHtml$1(action);
	    case SET_TEXT:
	      return setText$1(action);
	    case APPEND_HTML:
	      return appendHtml(action);
	    case PREPEND_HTML:
	      return prependHtml(action);
	    case REPLACE_HTML:
	      return replaceHtml(action);
	    case INSERT_BEFORE:
	      return insertBefore(action);
	    case INSERT_AFTER:
	      return insertAfter(action);
	    case CUSTOM_CODE:
	      return customCode(action);
	    case SET_ATTRIBUTE:
	      return setAttribute(action);
	    case SET_IMAGE_SOURCE:
	      return setImageSource(action);
	    case SET_STYLE:
	      return setStyle(action);
	    case RESIZE:
	      return resize(action);
	    case MOVE:
	      return move(action);
	    case REMOVE:
	      return remove$1(action);
	    case REARRANGE:
	      return rearrange(action);
	    case REDIRECT:
	      return redirect(action);
	    default:
	      return null;
	  }
	}
	function createActionsOption(option) {
	  const actions = option[CONTENT];
	  if (!isArray(actions)) {
	    return null;
	  }
	  if (isEmpty(actions)) {
	    return null;
	  }
	  const processedActions = filter(notNull$1, map(processAction, actions));
	  if (isEmpty(processedActions)) {
	    return null;
	  }
	  const result = reactorObjectAssign({}, option);
	  result.content = processedActions;
	  return result;
	}

	function getTokens(value = {}) {
	  const {
	    options
	  } = value;
	  if (!isArray(options)) {
	    return [];
	  }
	  if (isEmpty(options)) {
	    return [];
	  }
	  return filterNotNil(map(selectResponseTokens, options));
	}
	function getResponseTokens(response = {}) {
	  const {
	    execute = {},
	    prefetch = {}
	  } = response;
	  const {
	    pageLoad = {},
	    mboxes = []
	  } = execute;
	  const {
	    mboxes: prefetchMboxes = [],
	    views = []
	  } = prefetch;
	  const pageLoadTokens = getTokens(pageLoad);
	  const mboxesTokens = flatten(map(getTokens, mboxes));
	  const prefetchMboxesTokens = flatten(map(getTokens, prefetchMboxes));
	  const viewsTokens = flatten(map(getTokens, views));
	  return flatten([pageLoadTokens, mboxesTokens, prefetchMboxesTokens, viewsTokens]);
	}

	function getRedirect(response = {}) {
	  const {
	    execute = {}
	  } = response;
	  const {
	    pageLoad = {},
	    mboxes = []
	  } = execute;
	  const pageLoadOpts = selectOptions(pageLoad) || [];
	  const mboxesOpts = flatten(filterNotNil(map(selectOptions, mboxes)));
	  const options = flatten([pageLoadOpts, mboxesOpts]);
	  const actions = flatten(map(selectContent, filter(isActions, options)));
	  const redirectOptions = filter(isRedirect, options);
	  const redirectActions = filter(isRedirect, actions);
	  const redirects = redirectOptions.concat(redirectActions);
	  const result = {};
	  if (isEmpty(redirects)) {
	    return result;
	  }
	  const redirect = redirects[0];
	  const url = redirect.content;
	  if (isBlank(url)) {
	    return result;
	  }
	  result.url = url;
	  return result;
	}

	function getAnalytics(item = {}) {
	  const {
	    analytics
	  } = item;
	  return isEmpty(analytics) ? [] : [analytics];
	}
	function getAnalyticsDetails(response = {}) {
	  const {
	    execute = {},
	    prefetch = {}
	  } = response;
	  const {
	    pageLoad = {},
	    mboxes = []
	  } = execute;
	  const {
	    mboxes: prefetchMboxes = [],
	    views = [],
	    metrics = []
	  } = prefetch;
	  const pageLoadDetails = getAnalytics(pageLoad);
	  const mboxesDetails = flatten(map(getAnalytics, mboxes));
	  const prefetchMboxesDetails = flatten(map(getAnalytics, prefetchMboxes));
	  const viewsDetails = flatten(map(getAnalytics, views));
	  const prefetchMetrics = flatten(map(getAnalytics, metrics));
	  return flatten([pageLoadDetails, mboxesDetails, prefetchMboxesDetails, viewsDetails, prefetchMetrics]);
	}

	function addContextDetails(to, from) {
	  to.parameters = from.parameters;
	  to.profileParameters = from.profileParameters;
	  to.order = from.order;
	  to.product = from.product;
	}
	function addOptionsAndMetrics(result, arr) {
	  const options = arr[0];
	  const metrics = arr[1];
	  const hasOptions = !isEmpty(options);
	  const hasMetrics = !isEmpty(metrics);
	  if (!hasOptions && !hasMetrics) {
	    return result;
	  }
	  if (hasOptions) {
	    result.options = options;
	  }
	  if (hasMetrics) {
	    result.metrics = metrics;
	  }
	  return result;
	}
	function processOption(option) {
	  const {
	    type
	  } = option;
	  switch (type) {
	    case REDIRECT:
	      return resolve$1(createRedirectOption(option));
	    case DYNAMIC:
	      return createHtmlOption(option);
	    case ACTIONS:
	      return resolve$1(createActionsOption(option));
	    default:
	      return resolve$1(option);
	  }
	}
	function processOptions$1(options, predicate) {
	  if (!isArray(options)) {
	    return resolve$1([]);
	  }
	  if (isEmpty(options)) {
	    return resolve$1([]);
	  }
	  const validOptions = filter(predicate, options);
	  if (isEmpty(validOptions)) {
	    return resolve$1([]);
	  }
	  const optionsPromises = map(opt => processOption(opt), validOptions);
	  return all(optionsPromises).then(filterNotNil);
	}
	function processMetrics(metrics, predicate) {
	  if (!isArray(metrics)) {
	    return resolve$1([]);
	  }
	  if (isEmpty(metrics)) {
	    return resolve$1([]);
	  }
	  return resolve$1(filter(predicate, metrics));
	}
	function processPageLoad(httpContext) {
	  const {
	    response
	  } = httpContext;
	  const {
	    execute
	  } = response;
	  if (!isObject(execute)) {
	    return resolve$1(null);
	  }
	  const {
	    pageLoad
	  } = execute;
	  if (!isObject(pageLoad)) {
	    return resolve$1(null);
	  }
	  const {
	    analytics,
	    options,
	    metrics
	  } = pageLoad;
	  const result = {
	    analytics
	  };
	  return all([processOptions$1(options, isValidOption), processMetrics(metrics, isValidSelectorMetric)]).then(arr => addOptionsAndMetrics(result, arr));
	}
	function processExecuteMbox(item) {
	  const {
	    name,
	    analytics,
	    options,
	    metrics
	  } = item;
	  const result = {
	    name,
	    analytics
	  };
	  return all([processOptions$1(options, isValidOption), processMetrics(metrics, isValidMetric)]).then(arr => addOptionsAndMetrics(result, arr));
	}
	function processExecuteMboxes(httpContext) {
	  const {
	    response
	  } = httpContext;
	  const {
	    execute
	  } = response;
	  if (!isObject(execute)) {
	    return resolve$1([]);
	  }
	  const {
	    mboxes
	  } = execute;
	  if (!isArray(mboxes) || isEmpty(mboxes)) {
	    return resolve$1([]);
	  }
	  const validMboxes = filter(isValidMbox, mboxes);
	  return all(map(processExecuteMbox, validMboxes)).then(filterNotNil);
	}
	function sameMbox(mbox, index, name) {
	  return mbox.index === index && mbox.name === name;
	}
	function getRequestMbox(request, index, name) {
	  const {
	    prefetch = {}
	  } = request;
	  const {
	    mboxes = []
	  } = prefetch;
	  if (isEmpty(mboxes)) {
	    return null;
	  }
	  return first(filter(item => sameMbox(item, index, name), mboxes));
	}
	function processPrefetchMbox(request, item) {
	  const {
	    index,
	    name,
	    state,
	    analytics,
	    options,
	    metrics
	  } = item;
	  const requestMbox = getRequestMbox(request, index, name);
	  const result = {
	    name,
	    state,
	    analytics
	  };
	  if (!isNil(requestMbox)) {
	    addContextDetails(result, requestMbox);
	  }
	  return all([processOptions$1(options, isValidOptionEventToken), processMetrics(metrics, isValidMetric)]).then(arr => addOptionsAndMetrics(result, arr));
	}
	function processPrefetchMboxes(httpContext) {
	  const {
	    request,
	    response
	  } = httpContext;
	  const {
	    prefetch
	  } = response;
	  if (!isObject(prefetch)) {
	    return resolve$1([]);
	  }
	  const {
	    mboxes
	  } = prefetch;
	  if (!isArray(mboxes) || isEmpty(mboxes)) {
	    return resolve$1([]);
	  }
	  const validMboxes = filter(isValidPrefetchMbox, mboxes);
	  const process = item => processPrefetchMbox(request, item);
	  return all(map(process, validMboxes)).then(filterNotNil);
	}
	function getRequestView(request) {
	  const {
	    prefetch = {}
	  } = request;
	  const {
	    views = []
	  } = prefetch;
	  if (isEmpty(views)) {
	    return null;
	  }
	  return views[0];
	}
	function processView(request, view) {
	  const {
	    name,
	    state,
	    analytics,
	    options,
	    metrics
	  } = view;
	  const requestView = getRequestView(request);
	  const result = {
	    name: name.toLowerCase(),
	    state,
	    analytics
	  };
	  if (!isNil(requestView)) {
	    addContextDetails(result, requestView);
	  }
	  return all([processOptions$1(options, isValidOptionEventToken), processMetrics(metrics, isValidSelectorMetric)]).then(arr => addOptionsAndMetrics(result, arr));
	}
	function processPrefetchViews(httpContext) {
	  const {
	    request,
	    response
	  } = httpContext;
	  const {
	    prefetch
	  } = response;
	  if (!isObject(prefetch)) {
	    return resolve$1([]);
	  }
	  const {
	    views
	  } = prefetch;
	  if (!isArray(views) || isEmpty(views)) {
	    return resolve$1([]);
	  }
	  const validViews = filter(isValidView, views);
	  const process = view => processView(request, view);
	  return all(map(process, validViews)).then(filterNotNil);
	}
	function processPrefetchMetrics(httpContext) {
	  const {
	    response
	  } = httpContext;
	  const {
	    prefetch
	  } = response;
	  if (!isObject(prefetch)) {
	    return resolve$1([]);
	  }
	  const {
	    metrics
	  } = prefetch;
	  return processMetrics(metrics, isValidSelectorMetric);
	}
	function processMeta(httpContext) {
	  const {
	    response
	  } = httpContext;
	  const {
	    remoteMboxes,
	    remoteViews,
	    decisioningMethod
	  } = response;
	  const meta = {};
	  if (isObject(remoteMboxes)) {
	    meta.remoteMboxes = remoteMboxes;
	  }
	  if (isObject(remoteViews)) {
	    meta.remoteViews = remoteViews;
	  }
	  if (isString(decisioningMethod)) {
	    meta.decisioningMethod = decisioningMethod;
	  }
	  return resolve$1(meta);
	}
	function processNotification(notification) {
	  if (isNil(notification) || isBlank(notification.id)) {
	    return resolve$1(null);
	  }
	  const {
	    id
	  } = notification;
	  return resolve$1({
	    id
	  });
	}
	function processNotifications(httpContext) {
	  const {
	    response
	  } = httpContext;
	  const {
	    notifications
	  } = response;
	  if (!isArray(notifications)) {
	    return resolve$1([]);
	  }
	  return all(map(processNotification, notifications)).then(filterNotNil);
	}
	function createResponseContext(arr) {
	  const pageLoad = arr[0];
	  const mboxes = arr[1];
	  const prefetchMboxes = arr[2];
	  const views = arr[3];
	  const prefetchMetrics = arr[4];
	  const meta = arr[5];
	  const notifications = arr[6];
	  const result = {};
	  const execute = {};
	  if (isObject(pageLoad)) {
	    execute.pageLoad = pageLoad;
	  }
	  if (!isEmpty(mboxes)) {
	    execute.mboxes = mboxes;
	  }
	  const prefetch = {};
	  if (!isEmpty(prefetchMboxes)) {
	    prefetch.mboxes = prefetchMboxes;
	  }
	  if (!isEmpty(views)) {
	    prefetch.views = views;
	  }
	  if (!isEmpty(prefetchMetrics)) {
	    prefetch.metrics = prefetchMetrics;
	  }
	  if (!isEmpty(execute)) {
	    result.execute = execute;
	  }
	  if (!isEmpty(prefetch)) {
	    result.prefetch = prefetch;
	  }
	  if (!isEmpty(meta)) {
	    result.meta = meta;
	  }
	  if (!isEmpty(notifications)) {
	    result.notifications = notifications;
	  }
	  return result;
	}
	function processResponse(httpContext) {
	  const handlers = [handleTraces, handleDeviceId, handleEdgeCluster];
	  const context = flow(handlers)(httpContext);
	  const pageLoad = processPageLoad(context);
	  const mboxes = processExecuteMboxes(context);
	  const prefetchMboxes = processPrefetchMboxes(context);
	  const views = processPrefetchViews(context);
	  const prefetchMetrics = processPrefetchMetrics(context);
	  const meta = processMeta(context);
	  const notifications = processNotifications(context);
	  const promises = [pageLoad, mboxes, prefetchMboxes, views, prefetchMetrics, meta, notifications];
	  return all(promises).then(createResponseContext);
	}

	function hasRedirect(response) {
	  const redirect = getRedirect(response);
	  return !isEmpty(redirect);
	}
	function createEventPayload(response) {
	  const responseTokens = getResponseTokens(response);
	  const payload = {};
	  if (!isEmpty(responseTokens)) {
	    payload.responseTokens = responseTokens;
	  }
	  return payload;
	}

	function handleRequestSuccess(response) {
	  const payload = createEventPayload(response);
	  const analyticsDetails = getAnalyticsDetails(response);
	  if (!isEmpty(analyticsDetails)) {
	    payload.analyticsDetails = analyticsDetails;
	  }
	  logDebug(REQUEST_SUCCEEDED, response);
	  notifyRequestSucceeded(payload, hasRedirect(response));
	  return resolve$1(response);
	}
	function handleRequestError(error) {
	  logWarn(REQUEST_FAILED, error);
	  notifyRequestFailed({
	    error
	  });
	  return reject$1(error);
	}
	function executeGetOffers(options) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const {
	    consumerId = globalMbox,
	    request,
	    timeout
	  } = options;
	  const analytics = createAnalytics(consumerId, request);
	  const successFunc = response => handleRequestSuccess(response);
	  const errorFunc = error => handleRequestError(error);
	  if (!isEmpty(analytics)) {
	    const experienceCloud = request.experienceCloud || {};
	    experienceCloud.analytics = analytics;
	    request.experienceCloud = experienceCloud;
	  }
	  notifyRequestStart({});
	  return createAsyncDeliveryRequest(request, {}).then(deliveryRequest => executeRequest(options, deliveryRequest, timeout)).then(processResponse).then(successFunc)['catch'](errorFunc);
	}

	function addClass(cssClass, selector) {
	  return select(selector).addClass(cssClass);
	}
	function setCss(style, selector) {
	  return select(selector).css(style);
	}

	function getAttr(name, selector) {
	  return select(selector).attr(name);
	}
	function setAttr(name, value, selector) {
	  return select(selector).attr(name, value);
	}
	function removeAttr(name, selector) {
	  return select(selector).removeAttr(name);
	}
	function copyAttr(from, to, selector) {
	  const value = getAttr(from, selector);
	  if (isNotBlank(value)) {
	    removeAttr(from, selector);
	    setAttr(to, value, selector);
	  }
	}
	function hasAttr(name, selector) {
	  return isNotBlank(getAttr(name, selector));
	}

	const VISIBILITY_STATE = "visibilityState";
	const VISIBLE = "visible";
	const DELAY = 100;
	function createError$1(selector) {
	  return new Error("Could not find: " + selector);
	}
	function awaitUsingMutationObserver(selector, timeout, queryFunc) {
	  return create((res, rej) => {
	    const mo = getMutationObserver(() => {
	      const elems = queryFunc(selector);
	      if (!isEmpty(elems)) {
	        mo.disconnect();
	        res(elems);
	      }
	    });
	    delay(() => {
	      mo.disconnect();
	      rej(createError$1(selector));
	    }, timeout);
	    mo.observe(document, {
	      childList: true,
	      subtree: true
	    });
	  });
	}
	function canUseRequestAnimation() {
	  return document[VISIBILITY_STATE] === VISIBLE;
	}
	function awaitUsingRequestAnimation(selector, timeout, queryFunc) {
	  return create((res, rej) => {
	    function execute() {
	      const elems = queryFunc(selector);
	      if (!isEmpty(elems)) {
	        res(elems);
	        return;
	      }
	      window.requestAnimationFrame(execute);
	    }
	    execute();
	    delay(() => {
	      rej(createError$1(selector));
	    }, timeout);
	  });
	}
	function awaitUsingTimer(selector, timeout, queryFunc) {
	  return create((res, rej) => {
	    function execute() {
	      const elems = queryFunc(selector);
	      if (!isEmpty(elems)) {
	        res(elems);
	        return;
	      }
	      delay(execute, DELAY);
	    }
	    execute();
	    delay(() => {
	      rej(createError$1(selector));
	    }, timeout);
	  });
	}
	function awaitSelector(selector, timeout = getConfig()[SELECTORS_POLLING_TIMEOUT], queryFunc = select) {
	  const elems = queryFunc(selector);
	  if (!isEmpty(elems)) {
	    return resolve$1(elems);
	  }
	  if (canUseMutationObserver()) {
	    return awaitUsingMutationObserver(selector, timeout, queryFunc);
	  }
	  if (canUseRequestAnimation()) {
	    return awaitUsingRequestAnimation(selector, timeout, queryFunc);
	  }
	  return awaitUsingTimer(selector, timeout, queryFunc);
	}

	function getDataSrc(item) {
	  return getAttr(DATA_SRC, item);
	}
	function hasDataSrc(item) {
	  return hasAttr(DATA_SRC, item);
	}
	function disableImages(html) {
	  forEach(item => copyAttr(SRC, DATA_SRC, item), toArray(find(IMAGE_TAG, html)));
	  return html;
	}
	function enableImages(html) {
	  forEach(item => copyAttr(DATA_SRC, SRC, item), toArray(find(IMAGE_TAG, html)));
	  return html;
	}
	function loadImage(src) {
	  logDebug(LOADING_IMAGE, src);
	  return getAttr(SRC, setAttr(SRC, src, wrap("<" + IMAGE_TAG + "/>")));
	}
	function loadImages(html) {
	  const elements = filter(hasDataSrc, toArray(find(IMAGE_TAG, html)));
	  if (isEmpty(elements)) {
	    return html;
	  }
	  forEach(loadImage, map(getDataSrc, elements));
	  return html;
	}
	function renderImages(html) {
	  return flow([disableImages, loadImages, enableImages])(html);
	}

	function getUrl(item) {
	  const src = getAttr(SRC, item);
	  return isNotBlank(src) ? src : null;
	}
	function getScriptsUrls(html) {
	  return filter(isNotBlank, map(getUrl, toArray(find(SCRIPT, html))));
	}
	function loadScripts(urls) {
	  return reduce((acc, url) => acc.then(() => {
	    logDebug(REMOTE_SCRIPT, url);
	    addClientTrace({
	      remoteScript: url
	    });
	    return reactorLoadScript(url);
	  }), resolve$1(), urls);
	}

	function handleRenderingSuccess(action) {
	  return action;
	}
	function handleRenderingError(action, error) {
	  logWarn(UNEXPECTED_ERROR, error);
	  addClientTrace({
	    action,
	    error
	  });
	  return action;
	}
	function renderHtml(renderFunc, action) {
	  const container = select(action[SELECTOR]);
	  const html = renderImages(fragment(action[CONTENT]));
	  const urls = getScriptsUrls(html);
	  let result;
	  try {
	    result = resolve$1(renderFunc(container, html));
	  } catch (err) {
	    return reject$1(handleRenderingError(action, err));
	  }
	  if (isEmpty(urls)) {
	    return result.then(() => handleRenderingSuccess(action))['catch'](error => handleRenderingError(action, error));
	  }
	  return result.then(() => loadScripts(urls)).then(() => handleRenderingSuccess(action))['catch'](error => handleRenderingError(action, error));
	}

	const HEAD_TAGS_SELECTOR = SCRIPT_TAG + "," + LINK_TAG + "," + STYLE_TAG;
	function getHeadContent(content) {
	  const container = fragment(content);
	  const result = reduce((acc, elem) => {
	    acc.push(getHtml(fragment(elem)));
	    return acc;
	  }, [], toArray(find(HEAD_TAGS_SELECTOR, container)));
	  return join("", result);
	}
	function preprocessAction(action) {
	  const result = reactorObjectAssign({}, action);
	  const content = result[CONTENT];
	  if (isBlank(content)) {
	    return result;
	  }
	  const container = select(result[SELECTOR]);
	  if (!is(HEAD_TAG, container)) {
	    return result;
	  }
	  result[TYPE] = APPEND_HTML;
	  result[CONTENT] = getHeadContent(content);
	  return result;
	}
	function addPxIfRequired(value) {
	  const hasPx = value.indexOf("px") === value.length - 2;
	  return hasPx ? value : value + "px";
	}
	function setHtmlRenderFunc(container, html) {
	  return setHtml(getHtml(html), container);
	}
	function setHtml$2(action) {
	  logDebug(ACTION_RENDERING, action);
	  return renderHtml(setHtmlRenderFunc, action);
	}
	function setText$2(action) {
	  const container = select(action[SELECTOR]);
	  const content = action[CONTENT];
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  setText(content, container);
	  return resolve$1(action);
	}
	function appendHtmlRenderFunc(container, html) {
	  return append(getHtml(html), container);
	}
	function appendHtml$1(action) {
	  logDebug(ACTION_RENDERING, action);
	  return renderHtml(appendHtmlRenderFunc, action);
	}
	function prependHtmlRenderFunc(container, html) {
	  return prepend(getHtml(html), container);
	}
	function prependHtml$1(action) {
	  logDebug(ACTION_RENDERING, action);
	  return renderHtml(prependHtmlRenderFunc, action);
	}
	function replaceHtmlRenderFunc(container, html) {
	  const parentContainer = parent(container);
	  remove(before(getHtml(html), container));
	  return parentContainer;
	}
	function replaceHtml$1(action) {
	  logDebug(ACTION_RENDERING, action);
	  return renderHtml(replaceHtmlRenderFunc, action);
	}
	function insertBeforeRenderFunc(container, html) {
	  return prev(before(getHtml(html), container));
	}
	function insertBefore$1(action) {
	  logDebug(ACTION_RENDERING, action);
	  return renderHtml(insertBeforeRenderFunc, action);
	}
	function insertAfterRenderFunc(container, html) {
	  return next(after(getHtml(html), container));
	}
	function insertAfter$1(action) {
	  logDebug(ACTION_RENDERING, action);
	  return renderHtml(insertAfterRenderFunc, action);
	}
	function customCodeRenderFunc(container, html) {
	  return parent(before(getHtml(html), container));
	}
	function customCode$1(action) {
	  logDebug(ACTION_RENDERING, action);
	  return renderHtml(customCodeRenderFunc, action);
	}
	function setImageSource$1(action) {
	  const content = action[CONTENT];
	  const container = select(action[SELECTOR]);
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  removeAttr(SRC, container);
	  setAttr(SRC, loadImage(content), container);
	  return resolve$1(action);
	}
	function setAttribute$1(action) {
	  const content = action[CONTENT];
	  const container = select(action[SELECTOR]);
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  forEach((value, key) => setAttr(key, value, container), content);
	  return resolve$1(action);
	}
	function setCssWithPriority(container, style, priority) {
	  forEach(elem => {
	    forEach((value, key) => elem.style.setProperty(key, value, priority), style);
	  }, toArray(container));
	}
	function setStyle$1(action) {
	  const container = select(action[SELECTOR]);
	  const content = action[CONTENT];
	  const priority = content[PRIORITY];
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  if (isBlank(priority)) {
	    setCss(content, container);
	  } else {
	    setCssWithPriority(container, content, priority);
	  }
	  return resolve$1(action);
	}
	function resize$1(action) {
	  const container = select(action[SELECTOR]);
	  const content = action[CONTENT];
	  content[WIDTH] = addPxIfRequired(content[WIDTH]);
	  content[HEIGHT] = addPxIfRequired(content[HEIGHT]);
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  setCss(content, container);
	  return resolve$1(action);
	}
	function move$1(action) {
	  const container = select(action[SELECTOR]);
	  const content = action[CONTENT];
	  content[LEFT] = addPxIfRequired(content[LEFT]);
	  content[TOP] = addPxIfRequired(content[TOP]);
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  setCss(content, container);
	  return resolve$1(action);
	}
	function remove$2(action) {
	  const container = select(action[SELECTOR]);
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  remove(container);
	  return resolve$1(action);
	}
	function rearrange$1(action) {
	  const container = select(action[SELECTOR]);
	  const content = action[CONTENT];
	  const from = Number(content[FROM]);
	  const to = Number(content[TO]);
	  if (isNaN(from) && isNaN(to)) {
	    logDebug(REARRANGE_INCORRECT_INDEXES, action);
	    return reject$1(action);
	  }
	  const elements = toArray(children(container));
	  const elemFrom = elements[from];
	  const elemTo = elements[to];
	  if (!exists$2(elemFrom) || !exists$2(elemTo)) {
	    logDebug(REARRANGE_MISSING, action);
	    return reject$1(action);
	  }
	  logDebug(ACTION_RENDERING, action);
	  addClientTrace({
	    action
	  });
	  if (from < to) {
	    after(elemFrom, elemTo);
	  } else {
	    before(elemFrom, elemTo);
	  }
	  return resolve$1(action);
	}
	function executeRenderAction(action) {
	  const processedAction = preprocessAction(action);
	  const type = processedAction[TYPE];
	  switch (type) {
	    case SET_HTML:
	      return setHtml$2(processedAction);
	    case SET_TEXT:
	      return setText$2(processedAction);
	    case APPEND_HTML:
	      return appendHtml$1(processedAction);
	    case PREPEND_HTML:
	      return prependHtml$1(processedAction);
	    case REPLACE_HTML:
	      return replaceHtml$1(processedAction);
	    case INSERT_BEFORE:
	      return insertBefore$1(processedAction);
	    case INSERT_AFTER:
	      return insertAfter$1(processedAction);
	    case CUSTOM_CODE:
	      return customCode$1(processedAction);
	    case SET_ATTRIBUTE:
	      return setAttribute$1(processedAction);
	    case SET_IMAGE_SOURCE:
	      return setImageSource$1(processedAction);
	    case SET_STYLE:
	      return setStyle$1(processedAction);
	    case RESIZE:
	      return resize$1(processedAction);
	    case MOVE:
	      return move$1(processedAction);
	    case REMOVE:
	      return remove$2(processedAction);
	    case REARRANGE:
	      return rearrange$1(processedAction);
	    default:
	      return resolve$1(processedAction);
	  }
	}

	const ACTION_KEY_ATTR = "at-action-key";
	function isClickTracking(action) {
	  return action[TYPE] === TRACK_CLICK || action[TYPE] === SIGNAL_CLICK;
	}
	function hasValidSelector(action) {
	  const selector = action[SELECTOR];
	  return isNotBlank(selector) || isElement(selector);
	}
	function markAsRendered(action) {
	  const {
	    key
	  } = action;
	  if (isBlank(key)) {
	    return;
	  }
	  if (!hasValidSelector(action)) {
	    return;
	  }
	  const selector = action[SELECTOR];
	  setAttr(ACTION_KEY_ATTR, key, selector);
	}
	function removeActionCssHiding(action) {
	  const cssSelector = action[CSS_SELECTOR];
	  if (isBlank(cssSelector)) {
	    return;
	  }
	  removeActionHidingStyle(cssSelector);
	}
	function displayAction(action) {
	  if (!hasValidSelector(action)) {
	    removeActionCssHiding(action);
	    return;
	  }
	  const selector = action[SELECTOR];
	  if (isClickTracking(action)) {
	    addClass(CLICK_TRACKING_CSS_CLASS, selector);
	    return;
	  }
	  addClass(MARKER_CSS_CLASS, selector);
	  removeActionCssHiding(action);
	}
	function displayActions(actions) {
	  forEach(displayAction, actions);
	}
	function shouldRender(action) {
	  const {
	    key
	  } = action;
	  if (isBlank(key)) {
	    return true;
	  }
	  const type = action[TYPE];
	  if (type === CUSTOM_CODE) {
	    return action[PAGE];
	  }
	  const selector = action[SELECTOR];
	  const currentKey = getAttr(ACTION_KEY_ATTR, selector);
	  if (currentKey !== key) {
	    return true;
	  }
	  if (currentKey === key) {
	    return !action[PAGE];
	  }
	  return false;
	}
	function renderAwaitedAction(action) {
	  if (!shouldRender(action)) {
	    displayAction(action);
	    return action;
	  }
	  return executeRenderAction(action).then(() => {
	    logDebug(ACTION_RENDERED, action);
	    addClientTrace({
	      action
	    });
	    markAsRendered(action);
	    displayAction(action);
	    return action;
	  })['catch'](error => {
	    logWarn(UNEXPECTED_ERROR, error);
	    addClientTrace({
	      action,
	      error
	    });
	    displayAction(action);
	    const result = reactorObjectAssign({}, action);
	    result[ERROR] = true;
	    return result;
	  });
	}
	function postProcess(actions) {
	  const errorActions = filter(e => e[ERROR] === true, actions);
	  if (isEmpty(errorActions)) {
	    return resolve$1();
	  }
	  displayActions(errorActions);
	  return reject$1(actions);
	}
	function awaitAction(action) {
	  const selector = action[SELECTOR];
	  return awaitSelector(selector).then(() => action)['catch'](() => {
	    const result = reactorObjectAssign({}, action);
	    result[ERROR] = true;
	    return result;
	  });
	}
	function awaitAndRenderAction(action) {
	  return awaitAction(action).then(renderAwaitedAction);
	}
	function executeRenderActions(actions) {
	  const promises = map(awaitAndRenderAction, actions);
	  return all(promises).then(postProcess);
	}

	function addEventListener(type, func, selector) {
	  return select(selector).on(type, func);
	}
	function removeEventListener(type, func, selector) {
	  return select(selector).off(type, func);
	}

	const METRIC_ELEMENT_NOT_FOUND = "metric element not found";
	function executeMetric(metric) {
	  const selector = metric[SELECTOR];
	  return awaitSelector(selector).then(() => {
	    addClientTrace({
	      metric
	    });
	    const foundMetric = reactorObjectAssign({
	      found: true
	    }, metric);
	    return foundMetric;
	  })['catch'](() => {
	    logWarn(METRIC_ELEMENT_NOT_FOUND, metric);
	    addClientTrace({
	      metric,
	      message: METRIC_ELEMENT_NOT_FOUND
	    });
	    return metric;
	  });
	}

	function saveView(view) {
	  const key = view.name;
	  const views = getItem(VIEWS$1) || {};
	  views[key] = view;
	  setItem(VIEWS$1, views);
	}
	function findView(key, options = {}) {
	  const {
	    page = true
	  } = options;
	  const views = getItem(VIEWS$1) || {};
	  const result = views[key];
	  if (isNil(result)) {
	    return result;
	  }
	  const {
	    impressionId
	  } = options;
	  if (isNil(impressionId)) {
	    return result;
	  }
	  return reactorObjectAssign({
	    page,
	    impressionId
	  }, result);
	}
	function persistViews(views) {
	  forEach(saveView, views);
	}

	const NAVIGATOR = "navigator";
	const SEND_BEACON = "sendBeacon";
	function executeSendBeacon(win, url, data) {
	  return win[NAVIGATOR][SEND_BEACON](url, data);
	}
	function executeSyncXhr(http, url, data) {
	  const headers = {};
	  headers[CONTENT_TYPE] = [TEXT_PLAIN];
	  const options = {};
	  options[METHOD] = POST$1;
	  options[URL] = url;
	  options[DATA$1] = data;
	  options[CREDENTIALS] = true;
	  options[ASYNC] = false;
	  options[HEADERS] = headers;
	  try {
	    http(options);
	  } catch (error) {
	    return false;
	  }
	  return true;
	}
	function isBeaconSupported(win) {
	  return NAVIGATOR in win && SEND_BEACON in win[NAVIGATOR];
	}
	function sendBeacon(url, data) {
	  if (isBeaconSupported(window)) {
	    return executeSendBeacon(window, url, data);
	  }
	  return executeSyncXhr(xhr, url, data);
	}

	const SEND_BEACON_SUCCESS = "Beacon data sent";
	const SEND_BEACON_ERROR = "Beacon data sent failed";
	const VIEW_TRIGGERED = "View triggered notification";
	const VIEW_RENDERED = "View rendered notification";
	const MBOXES_RENDERED = "Mboxes rendered notification";
	const EVENT_HANDLER = "Event handler notification";
	const MBOX_EVENT_HANDLER = "Mbox event handler notification";
	const VIEW_EVENT_HANDLER = "View event handler notification";
	const PREFETCH_MBOXES = "prefetchMboxes";
	const RENDERED = "rendered";
	const TRIGGERED = "triggered";
	function createRequest(consumerId) {
	  const analytics = createAnalytics(consumerId, {});
	  const request = {
	    context: {
	      beacon: true
	    }
	  };
	  if (!isEmpty(analytics)) {
	    const experienceCloud = {};
	    experienceCloud.analytics = analytics;
	    request.experienceCloud = experienceCloud;
	  }
	  return request;
	}
	function createSyncNotificationRequest(consumerId, params, notifications) {
	  const request = createRequest(consumerId);
	  const result = createSyncDeliveryRequest(request, params);
	  result.notifications = notifications;
	  return result;
	}
	function createAsyncNotificationRequest(consumerId, params, notifications) {
	  const request = createRequest(consumerId);
	  return createAsyncDeliveryRequest(request, params).then(result => {
	    result.notifications = notifications;
	    return result;
	  });
	}
	function createNotification(item, type, tokens) {
	  const id = uuid();
	  const timestamp = now();
	  const {
	    parameters,
	    profileParameters,
	    order,
	    product
	  } = item;
	  const result = {
	    id,
	    type,
	    timestamp,
	    parameters,
	    profileParameters,
	    order,
	    product
	  };
	  if (isEmpty(tokens)) {
	    return result;
	  }
	  result.tokens = tokens;
	  return result;
	}
	function createMboxNotification(mbox, type, tokens) {
	  const {
	    name,
	    state
	  } = mbox;
	  const notification = createNotification(mbox, type, tokens);
	  notification.mbox = {
	    name,
	    state
	  };
	  return notification;
	}
	function createViewNotification(view, type, tokens) {
	  const {
	    name,
	    state
	  } = view;
	  const notification = createNotification(view, type, tokens);
	  notification.view = {
	    name,
	    state
	  };
	  return notification;
	}
	function executeBeaconNotification(request) {
	  const config = getConfig();
	  const url = createRequestUrl(config);
	  const data = JSON.stringify(request);
	  if (sendBeacon(url, data)) {
	    logDebug(SEND_BEACON_SUCCESS, url, request);
	    return true;
	  }
	  logWarn(SEND_BEACON_ERROR, url, request);
	  return false;
	}
	function sendEventNotification(source, type, token) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const params = getTargetPageParams(globalMbox);
	  const requestDetails = createRequestDetails({}, params);
	  const notification = createNotification(requestDetails, type, [token]);
	  const request = createSyncNotificationRequest(uuid(), params, [notification]);
	  logDebug(EVENT_HANDLER, source, notification);
	  addClientTrace({
	    source,
	    event: type,
	    request
	  });
	  executeBeaconNotification(request);
	}
	function sendMboxEventNotification(name, type, token) {
	  const params = getTargetPageParams(name);
	  const requestDetails = createRequestDetails({}, params);
	  const notification = createNotification(requestDetails, type, [token]);
	  notification.mbox = {
	    name
	  };
	  const request = createSyncNotificationRequest(uuid(), params, [notification]);
	  logDebug(MBOX_EVENT_HANDLER, name, notification);
	  addClientTrace({
	    mbox: name,
	    event: type,
	    request
	  });
	  executeBeaconNotification(request);
	}
	function sendMboxesRenderedNotifications(items) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const notifications = [];
	  const type = DISPLAY_EVENT;
	  forEach(item => {
	    const {
	      mbox,
	      data
	    } = item;
	    if (isNil(data)) {
	      return;
	    }
	    const {
	      eventTokens = []
	    } = data;
	    if (isEmpty(eventTokens)) {
	      return;
	    }
	    notifications.push(createMboxNotification(mbox, type, eventTokens));
	  }, items);
	  if (isEmpty(notifications)) {
	    return;
	  }
	  const request = createSyncNotificationRequest(globalMbox, {}, notifications);
	  logDebug(MBOXES_RENDERED, notifications);
	  addClientTrace({
	    source: PREFETCH_MBOXES,
	    event: RENDERED,
	    request
	  });
	  executeBeaconNotification(request);
	}
	function sendViewEventNotification(name, type, token) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const params = getTargetPageParams(globalMbox);
	  const requestDetails = createRequestDetails({}, params);
	  const notification = createNotification(requestDetails, type, [token]);
	  notification.view = {
	    name
	  };
	  const request = createSyncNotificationRequest(uuid(), params, [notification]);
	  logDebug(VIEW_EVENT_HANDLER, name, notification);
	  addClientTrace({
	    view: name,
	    event: type,
	    request
	  });
	  executeBeaconNotification(request);
	}
	function sendViewTriggeredNotifications(options) {
	  const {
	    viewName: name,
	    impressionId
	  } = options;
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const params = getTargetPageParams(globalMbox);
	  const requestDetails = createRequestDetails({}, params);
	  const notification = createNotification(requestDetails, DISPLAY_EVENT, []);
	  notification.view = {
	    name
	  };
	  logDebug(VIEW_TRIGGERED, name);
	  createAsyncNotificationRequest(name, params, [notification]).then(request => {
	    request.impressionId = impressionId;
	    addClientTrace({
	      view: name,
	      event: TRIGGERED,
	      request
	    });
	    executeBeaconNotification(request);
	  });
	}
	function sendViewRenderedNotifications(item) {
	  if (isNil(item)) {
	    return;
	  }
	  const {
	    view,
	    data = {}
	  } = item;
	  const {
	    eventTokens = []
	  } = data;
	  const {
	    name,
	    impressionId
	  } = view;
	  const persistedView = findView(name);
	  if (isNil(persistedView)) {
	    return;
	  }
	  const notification = createViewNotification(persistedView, DISPLAY_EVENT, eventTokens);
	  const request = createSyncNotificationRequest(name, {}, [notification]);
	  request.impressionId = impressionId;
	  logDebug(VIEW_RENDERED, name, eventTokens);
	  addClientTrace({
	    view: name,
	    event: RENDERED,
	    request
	  });
	  executeBeaconNotification(request);
	}

	const CACHE$1 = {};
	const PAGE_LOAD$1 = "pageLoadMetrics";
	const PREFETCH = "prefetchMetrics";
	const selectMetrics = prop(METRICS);
	const createMetricSuccess = () => createSuccess(METRIC);
	const createMetricError = error => createError(METRIC, error);
	function decorateElementIfRequired(type, selector) {
	  if (type !== CLICK) {
	    return;
	  }
	  addClass(CLICK_TRACKING_CSS_CLASS, selector);
	}
	function isHandlerCached(name, key) {
	  return !isNil(CACHE$1[name]) && !isNil(CACHE$1[name][key]);
	}
	function removePreviousHandlersFromCache(currentViewName, type, selector) {
	  if (!isNil(CACHE$1[currentViewName])) {
	    return;
	  }
	  const viewNames = keys(CACHE$1);
	  if (isEmpty(viewNames)) {
	    return;
	  }
	  forEach(viewName => {
	    const handlerNames = keys(CACHE$1[viewName]);
	    forEach(handlerName => {
	      const func = CACHE$1[viewName][handlerName];
	      removeEventListener(type, func, selector);
	    }, handlerNames);
	    delete CACHE$1[viewName];
	  }, viewNames);
	}
	function addHandlerToCache(name, key, handler) {
	  CACHE$1[name] = CACHE$1[name] || {};
	  CACHE$1[name][key] = handler;
	}
	function attachEventHandler(name, fromView, metric, notifyFunc) {
	  const {
	    type,
	    selector,
	    eventToken
	  } = metric;
	  const key = hash(type + ":" + selector + ":" + eventToken);
	  const handler = () => notifyFunc(name, type, eventToken);
	  decorateElementIfRequired(type, selector);
	  if (!fromView) {
	    addEventListener(type, handler, selector);
	    return;
	  }
	  if (isHandlerCached(name, key)) {
	    return;
	  }
	  removePreviousHandlersFromCache(name, type, selector);
	  addHandlerToCache(name, key, handler);
	  addEventListener(type, handler, selector);
	}
	function attachMetricEventHandlers(name, fromView, metrics, notifyFunc) {
	  return all(map(executeMetric, metrics)).then(arr => {
	    forEach(metric => attachEventHandler(name, fromView, metric, notifyFunc), filter(metric => metric.found, arr));
	    return createMetricSuccess();
	  })['catch'](createMetricError);
	}
	function executeMboxMetrics(mbox) {
	  const {
	    name
	  } = mbox;
	  return attachMetricEventHandlers(name, false, selectMetrics(mbox), sendMboxEventNotification);
	}
	function executeViewMetrics(view) {
	  const {
	    name
	  } = view;
	  return attachMetricEventHandlers(name, true, selectMetrics(view), sendViewEventNotification);
	}
	function executePageLoadMetrics(pageLoad) {
	  return attachMetricEventHandlers(PAGE_LOAD$1, false, selectMetrics(pageLoad), sendEventNotification);
	}
	function executePrefetchMetrics(prefetch) {
	  return attachMetricEventHandlers(PREFETCH, false, selectMetrics(prefetch), sendEventNotification);
	}

	const selectContent$1 = prop(CONTENT);
	const selectCssSelector = prop(CSS_SELECTOR);
	const createRenderSuccess = data => createSuccess(RENDER, data);
	const createRenderError = error => createError(RENDER, error);
	const hasNonErrorData = val => not(isError)(val) && hasData(val);
	function hideActions(actions) {
	  const items = map(selectCssSelector, actions);
	  injectActionHidingStyles(filterNotBlank(items));
	}
	function hideAllViewsActions(actions) {
	  const items = map(selectCssSelector, actions);
	  injectAllViewsHidingStyle(filterNotNil(items));
	}
	function extractActions(item) {
	  const options = filter(isActions, selectOptions(item));
	  return flatten(map(selectContent$1, options));
	}
	function isValidAction(action) {
	  return isObject(action) && action.type !== SET_JSON;
	}
	function decorateActions(actions, key, page) {
	  return map(e => reactorObjectAssign({
	    key,
	    page
	  }, e), filter(isValidAction, actions));
	}
	function executeRendering(option, key, page) {
	  const {
	    eventToken,
	    responseTokens,
	    content
	  } = option;
	  const actions = decorateActions(content, key, page);
	  return executeRenderActions(actions).then(() => createRenderSuccess({
	    eventToken,
	    responseTokens
	  }))['catch'](createRenderError);
	}
	function isValidOption$1(option) {
	  return isObject(option) && option.type !== JSON$1;
	}
	function renderOptions(func, item) {
	  return map(func, filter(isValidOption$1, selectOptions(item)));
	}
	function postExecuteRendering(key, item, values) {
	  const result = {
	    status: SUCCESS,
	    [key]: item
	  };
	  const errors = map(selectData, filter(isError, values));
	  const data = {};
	  if (!isEmpty(errors)) {
	    result.status = ERROR;
	    data.errors = errors;
	  }
	  if (!isEmpty(data)) {
	    result.data = data;
	  }
	  return result;
	}
	function postPrefetchRendering(key, item, values) {
	  const result = {
	    status: SUCCESS,
	    [key]: item
	  };
	  const errors = map(selectData, filter(isError, values));
	  const renderData = map(selectData, filter(hasNonErrorData, values));
	  const eventTokens = filterNotNil(map(selectEventToken, renderData));
	  const responseTokens = filterNotNil(map(selectResponseTokens, renderData));
	  const data = {};
	  if (!isEmpty(errors)) {
	    result.status = ERROR;
	    data.errors = errors;
	  }
	  if (!isEmpty(eventTokens)) {
	    data.eventTokens = eventTokens;
	  }
	  if (!isEmpty(responseTokens)) {
	    data.responseTokens = responseTokens;
	  }
	  if (!isEmpty(data)) {
	    result.data = data;
	  }
	  return result;
	}
	function renderExecuteItem(item, postRenderingFunc, metricsFunc) {
	  const render = opt => executeRendering(opt, true);
	  const options = renderOptions(render, item);
	  return all(options).then(postRenderingFunc).then(result => {
	    metricsFunc(item);
	    return result;
	  });
	}
	function renderPrefetchItem(key, item, page, metricsFunc) {
	  const {
	    name
	  } = item;
	  const render = opt => executeRendering(opt, name, page);
	  const options = renderOptions(render, item);
	  return all(options).then(arr => postPrefetchRendering(key, item, arr)).then(result => {
	    metricsFunc(item);
	    return result;
	  });
	}
	function renderMbox(mbox) {
	  const postRenderingFunc = arr => postExecuteRendering(MBOX, mbox, arr);
	  return renderExecuteItem(mbox, postRenderingFunc, executeMboxMetrics);
	}
	function renderPrefetchMbox(mbox) {
	  return renderPrefetchItem(MBOX, mbox, true, executeMboxMetrics);
	}
	function hideOptions(item) {
	  const actions = extractActions(item);
	  hideActions(actions);
	}
	function hidePageLoadOptions(context, skipPrehiding = false) {
	  if (skipPrehiding) {
	    return;
	  }
	  const {
	    execute = {}
	  } = context;
	  const {
	    pageLoad = {}
	  } = execute;
	  if (!isEmpty(pageLoad)) {
	    hideOptions(pageLoad);
	  }
	}
	function hideAllViews(context) {
	  const {
	    prefetch = {}
	  } = context;
	  const {
	    views = []
	  } = prefetch;
	  if (isEmpty(views)) {
	    return;
	  }
	  const actions = flatten(map(extractActions, views));
	  hideAllViewsActions(actions);
	}
	function hideViewOptions(view) {
	  const actions = extractActions(view);
	  hideActions(actions);
	  removeAllViewsHidingStyle();
	}
	function renderPageLoad(pageLoad) {
	  const postRenderingFunc = arr => postExecuteRendering(PAGE_LOAD, pageLoad, arr);
	  return renderExecuteItem(pageLoad, postRenderingFunc, executePageLoadMetrics);
	}
	function renderMboxes(mboxes) {
	  return all(map(renderMbox, mboxes));
	}
	function renderPrefetchMboxes(mboxes) {
	  return all(map(renderPrefetchMbox, mboxes));
	}
	function renderPrefetchMetrics(prefetch) {
	  const metrics = [executePrefetchMetrics(prefetch)];
	  return all(metrics).then(postExecuteRendering);
	}
	function renderView(view) {
	  const {
	    page
	  } = view;
	  return renderPrefetchItem(VIEW, view, page, executeViewMetrics);
	}

	function E() {
	}
	E.prototype = {
	  on: function (name, callback, ctx) {
	    var e = this.e || (this.e = {});
	    (e[name] || (e[name] = [])).push({
	      fn: callback,
	      ctx: ctx
	    });
	    return this;
	  },
	  once: function (name, callback, ctx) {
	    var self = this;
	    function listener() {
	      self.off(name, listener);
	      callback.apply(ctx, arguments);
	    }
	    listener._ = callback;
	    return this.on(name, listener, ctx);
	  },
	  emit: function (name) {
	    var data = [].slice.call(arguments, 1);
	    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
	    var i = 0;
	    var len = evtArr.length;
	    for (i; i < len; i++) {
	      evtArr[i].fn.apply(evtArr[i].ctx, data);
	    }
	    return this;
	  },
	  off: function (name, callback) {
	    var e = this.e || (this.e = {});
	    var evts = e[name];
	    var liveEvents = [];
	    if (evts && callback) {
	      for (var i = 0, len = evts.length; i < len; i++) {
	        if (evts[i].fn !== callback && evts[i].fn._ !== callback) liveEvents.push(evts[i]);
	      }
	    }
	    liveEvents.length ? e[name] = liveEvents : delete e[name];
	    return this;
	  }
	};
	var tinyEmitter = E;
	var TinyEmitter = E;
	tinyEmitter.TinyEmitter = TinyEmitter;

	function create$1() {
	  return new tinyEmitter();
	}
	function publishOn(eventBus, name, args) {
	  eventBus.emit(name, args);
	}
	function subscribeTo(eventBus, name, func) {
	  eventBus.on(name, func);
	}

	const EVENT_BUS = create$1();
	function publish(name, args) {
	  publishOn(EVENT_BUS, name, args);
	}
	function subscribe(name, func) {
	  subscribeTo(EVENT_BUS, name, func);
	}

	function redirect$1(option) {
	  return {
	    type: REDIRECT,
	    content: option.url
	  };
	}
	function setContent(action) {
	  const result = {};
	  result.type = SET_HTML;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function setText$3(action) {
	  const result = {};
	  result.type = SET_TEXT;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function appendContent(action) {
	  const result = {};
	  result.type = APPEND_HTML;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function prependContent(action) {
	  const result = {};
	  result.type = PREPEND_HTML;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function replaceContent(action) {
	  const result = {};
	  result.type = REPLACE_HTML;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function insertBefore$2(action) {
	  const result = {};
	  result.type = INSERT_BEFORE;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function insertAfter$2(action) {
	  const result = {};
	  result.type = INSERT_AFTER;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function customCode$2(action) {
	  const result = {};
	  result.type = CUSTOM_CODE;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function setAttribute$2(action) {
	  const result = {};
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  if (action.attribute === SRC) {
	    result.type = SET_IMAGE_SOURCE;
	    result.content = action.value;
	    return result;
	  }
	  result.type = SET_ATTRIBUTE;
	  const content = {};
	  content[action.attribute] = action.value;
	  result.content = content;
	  return result;
	}
	function setStyle$2(action) {
	  const {
	    style = {}
	  } = action;
	  const result = {};
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  if (!isNil(style.left) && !isNil(style.top)) {
	    result.type = MOVE;
	    result.content = style;
	    return result;
	  }
	  if (!isNil(style.width) && !isNil(style.height)) {
	    result.type = RESIZE;
	    result.content = style;
	    return result;
	  }
	  result.type = SET_STYLE;
	  result.content = style;
	  return result;
	}
	function remove$3(action) {
	  const result = {};
	  result.type = REMOVE;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function rearrange$2(action) {
	  const content = {};
	  content.from = action.from;
	  content.to = action.to;
	  const result = {};
	  result.type = REARRANGE;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  result.content = content;
	  return result;
	}
	function hasSelectors(action) {
	  return isNotBlank(action.selector) && isNotBlank(action.cssSelector);
	}
	function createPageLoad(items) {
	  const result = {};
	  if (isEmpty(items)) {
	    return result;
	  }
	  const options = [];
	  const metrics = [];
	  const actions = [];
	  forEach(item => {
	    const type = item.action;
	    switch (type) {
	      case SET_CONTENT:
	        if (hasSelectors(item)) {
	          actions.push(setContent(item));
	        } else {
	          options.push({
	            type: HTML,
	            content: item.content
	          });
	        }
	        break;
	      case SET_JSON:
	        if (!isEmpty(item.content)) {
	          forEach(e => options.push({
	            type: JSON$1,
	            content: e
	          }), item.content);
	        }
	        break;
	      case SET_TEXT:
	        actions.push(setText$3(item));
	        break;
	      case APPEND_CONTENT:
	        actions.push(appendContent(item));
	        break;
	      case PREPEND_CONTENT:
	        actions.push(prependContent(item));
	        break;
	      case REPLACE_CONTENT:
	        actions.push(replaceContent(item));
	        break;
	      case INSERT_BEFORE:
	        actions.push(insertBefore$2(item));
	        break;
	      case INSERT_AFTER:
	        actions.push(insertAfter$2(item));
	        break;
	      case CUSTOM_CODE:
	        actions.push(customCode$2(item));
	        break;
	      case SET_ATTRIBUTE:
	        actions.push(setAttribute$2(item));
	        break;
	      case SET_STYLE:
	        actions.push(setStyle$2(item));
	        break;
	      case REMOVE:
	        actions.push(remove$3(item));
	        break;
	      case REARRANGE:
	        actions.push(rearrange$2(item));
	        break;
	      case REDIRECT:
	        options.push(redirect$1(item));
	        break;
	      case TRACK_CLICK:
	        metrics.push({
	          type: CLICK,
	          selector: item.selector,
	          eventToken: item.clickTrackId
	        });
	        break;
	    }
	  }, items);
	  const pageLoad = {};
	  const hasActions = !isEmpty(actions);
	  if (hasActions) {
	    options.push({
	      type: ACTIONS,
	      content: actions
	    });
	  }
	  const hasOptions = !isEmpty(options);
	  if (hasOptions) {
	    pageLoad.options = options;
	  }
	  const hasMetrics = !isEmpty(metrics);
	  if (hasMetrics) {
	    pageLoad.metrics = metrics;
	  }
	  if (isEmpty(pageLoad)) {
	    return result;
	  }
	  const execute = {};
	  execute.pageLoad = pageLoad;
	  result.execute = execute;
	  return result;
	}
	function createMboxes(name, items) {
	  const result = {};
	  if (isEmpty(items)) {
	    return result;
	  }
	  const options = [];
	  const metrics = [];
	  forEach(item => {
	    const type = item.action;
	    switch (type) {
	      case SET_CONTENT:
	        options.push({
	          type: HTML,
	          content: item.content
	        });
	        break;
	      case SET_JSON:
	        if (!isEmpty(item.content)) {
	          forEach(e => options.push({
	            type: JSON$1,
	            content: e
	          }), item.content);
	        }
	        break;
	      case REDIRECT:
	        options.push(redirect$1(item));
	        break;
	      case SIGNAL_CLICK:
	        metrics.push({
	          type: CLICK,
	          eventToken: item.clickTrackId
	        });
	        break;
	    }
	  }, items);
	  const mbox = {
	    name
	  };
	  const hasOptions = !isEmpty(options);
	  if (hasOptions) {
	    mbox.options = options;
	  }
	  const hasMetrics = !isEmpty(metrics);
	  if (hasMetrics) {
	    mbox.metrics = metrics;
	  }
	  if (isEmpty(mbox)) {
	    return result;
	  }
	  const execute = {};
	  const mboxes = [mbox];
	  execute.mboxes = mboxes;
	  result.execute = execute;
	  return result;
	}
	function convertToContext(mbox, items, pageLoadEnabled) {
	  if (pageLoadEnabled) {
	    return createPageLoad(items);
	  }
	  return createMboxes(mbox, items);
	}

	const PAGE_LOAD_RENDERING_FAILED = "Page load rendering failed";
	const MBOXES_RENDERING_FAILED = "Mboxes rendering failed";
	const VIEW_RENDERING_FAILED = "View rendering failed";
	const PREFETCH_RENDERING_FAILED = "Prefetch rendering failed";
	const hasErrors = items => !isEmpty(filter(isError, items));
	function getPageLoadData(pageLoad) {
	  const {
	    status,
	    data
	  } = pageLoad;
	  const result = {
	    status,
	    pageLoad: true
	  };
	  if (!isNil(data)) {
	    result.data = data;
	  }
	  return result;
	}
	function getMboxData(item) {
	  const {
	    status,
	    mbox,
	    data
	  } = item;
	  const {
	    name
	  } = mbox;
	  const result = {
	    status,
	    mbox: name
	  };
	  if (!isNil(data)) {
	    result.data = data;
	  }
	  return result;
	}
	function getViewData(item) {
	  const {
	    status,
	    view,
	    data
	  } = item;
	  const {
	    name
	  } = view;
	  const result = {
	    status,
	    view: name
	  };
	  if (!isNil(data)) {
	    result.data = data;
	  }
	  return result;
	}
	function getPrefetchMetricsData(prefetchMetrics) {
	  const {
	    status,
	    data
	  } = prefetchMetrics;
	  const result = {
	    status,
	    prefetchMetrics: true
	  };
	  if (!isNil(data)) {
	    result.data = data;
	  }
	  return result;
	}
	function handlePageLoad(pageLoad) {
	  if (isNil(pageLoad)) {
	    return [null];
	  }
	  const result = map(getPageLoadData, [pageLoad]);
	  if (hasErrors(result)) {
	    logWarn(PAGE_LOAD_RENDERING_FAILED, pageLoad);
	  }
	  return result;
	}
	function handleMboxes(mboxes) {
	  if (isNil(mboxes)) {
	    return [null];
	  }
	  const result = map(getMboxData, mboxes);
	  if (hasErrors(result)) {
	    logWarn(MBOXES_RENDERING_FAILED, mboxes);
	  }
	  return result;
	}
	function handlePrefetchMboxes(mboxes, func = sendMboxesRenderedNotifications) {
	  if (isNil(mboxes)) {
	    return [null];
	  }
	  const result = map(getMboxData, mboxes);
	  if (hasErrors(result)) {
	    logWarn(MBOXES_RENDERING_FAILED, mboxes);
	  }
	  func(mboxes);
	  return result;
	}
	function handleView(item, func = sendViewRenderedNotifications) {
	  if (isNil(item)) {
	    return [null];
	  }
	  const result = map(getViewData, [item]);
	  if (hasErrors(result)) {
	    logWarn(VIEW_RENDERING_FAILED, item);
	  }
	  const {
	    view
	  } = item;
	  if (!view.page) {
	    return result;
	  }
	  func(item);
	  return result;
	}
	function handlePrefetchMetrics(prefetchMetrics) {
	  if (isNil(prefetchMetrics)) {
	    return [null];
	  }
	  const result = map(getPrefetchMetricsData, [prefetchMetrics]);
	  if (hasErrors(result)) {
	    logWarn(PREFETCH_RENDERING_FAILED, prefetchMetrics);
	  }
	  return result;
	}
	function handleRenderingSuccess$1(values) {
	  const results = flatten([handlePageLoad(values[0]), handleMboxes(values[1]), handlePrefetchMboxes(values[2]), handlePrefetchMetrics(values[3])]);
	  const nonNull = filter(notNil, results);
	  const errors = filter(isError, nonNull);
	  if (!isEmpty(errors)) {
	    return reject$1(errors);
	  }
	  return resolve$1(nonNull);
	}
	function handleRenderingError$1(err) {
	  return reject$1(err);
	}

	function processOptions$2(selector, item) {
	  if (isEmpty(item)) {
	    return;
	  }
	  const {
	    options
	  } = item;
	  if (isEmpty(options)) {
	    return;
	  }
	  forEach(option => {
	    if (option.type !== HTML) {
	      return;
	    }
	    const type = SET_HTML;
	    const {
	      content
	    } = option;
	    option.type = ACTIONS;
	    option.content = [{
	      type,
	      selector,
	      content
	    }];
	  }, options);
	}
	function processMetrics$1(selector, item) {
	  const {
	    metrics
	  } = item;
	  if (isEmpty(metrics)) {
	    return;
	  }
	  const {
	    name
	  } = item;
	  forEach(metric => {
	    metric.name = name;
	    metric.selector = metric.selector || selector;
	  }, metrics);
	}
	function createRenderingContext(selector, context) {
	  const result = reactorObjectAssign({}, context);
	  const {
	    execute = {},
	    prefetch = {}
	  } = result;
	  const {
	    pageLoad = {},
	    mboxes = []
	  } = execute;
	  const {
	    mboxes: prefetchMboxes = []
	  } = prefetch;
	  processOptions$2(selector, pageLoad);
	  forEach(elem => processOptions$2(selector, elem), mboxes);
	  forEach(elem => processMetrics$1(selector, elem), mboxes);
	  forEach(elem => processOptions$2(selector, elem), prefetchMboxes);
	  forEach(elem => processMetrics$1(selector, elem), prefetchMboxes);
	  return result;
	}
	function persistViewsIfPresent(context) {
	  const {
	    prefetch = {}
	  } = context;
	  const {
	    views = []
	  } = prefetch;
	  if (isEmpty(views)) {
	    return;
	  }
	  persistViews(views);
	}
	function renderContext(context) {
	  const promises = [];
	  const {
	    execute = {}
	  } = context;
	  const {
	    pageLoad = {},
	    mboxes = []
	  } = execute;
	  if (!isEmpty(pageLoad)) {
	    promises.push(renderPageLoad(pageLoad));
	  } else {
	    promises.push(resolve$1(null));
	  }
	  if (!isEmpty(mboxes)) {
	    promises.push(renderMboxes(mboxes));
	  } else {
	    promises.push(resolve$1(null));
	  }
	  const {
	    prefetch = {}
	  } = context;
	  const {
	    mboxes: prefetchMboxes = [],
	    metrics = []
	  } = prefetch;
	  if (!isEmpty(prefetchMboxes)) {
	    promises.push(renderPrefetchMboxes(prefetchMboxes));
	  } else {
	    promises.push(resolve$1(null));
	  }
	  if (isArray(metrics) && !isEmpty(metrics)) {
	    promises.push(renderPrefetchMetrics(prefetch));
	  } else {
	    promises.push(resolve$1(null));
	  }
	  removeHidingSnippetStyle();
	  return all(promises).then(handleRenderingSuccess$1)['catch'](handleRenderingError$1);
	}
	function executeRedirect(win, url) {
	  delay(() => win.location.replace(url));
	}
	function retrieveSelector(selector) {
	  if (isNotBlank(selector)) {
	    return selector;
	  }
	  if (isElement(selector)) {
	    return selector;
	  }
	  return HEAD_TAG;
	}
	function showElement(selector) {
	  addClass(MARKER_CSS_CLASS, selector);
	}
	function executeApplyOffer(options) {
	  const {
	    mbox,
	    selector,
	    offer: actions
	  } = options;
	  const config = getConfig();
	  const pageLoadEnabled = mbox === config[GLOBAL_MBOX_NAME];
	  if (isEmpty(actions)) {
	    logDebug(NO_ACTIONS);
	    showElement(selector);
	    removeHidingSnippetStyle();
	    notifyRenderingNoOffers({
	      mbox
	    });
	    return;
	  }
	  const context = convertToContext(mbox, actions, pageLoadEnabled);
	  const renderingContext = createRenderingContext(selector, context);
	  const redirect = getRedirect(renderingContext);
	  if (!isEmpty(redirect)) {
	    const {
	      url
	    } = redirect;
	    logDebug(REDIRECT_ACTION, redirect);
	    notifyRenderingRedirect({
	      url
	    });
	    executeRedirect(window, url);
	    return;
	  }
	  notifyRenderingStart({
	    mbox
	  });
	  hidePageLoadOptions(renderingContext);
	  renderContext(renderingContext).then(execution => {
	    if (isEmpty(execution)) {
	      return;
	    }
	    notifyRenderingSucceeded({
	      mbox,
	      execution
	    });
	  })['catch'](error => notifyRenderingFailed({
	    error
	  }));
	}
	function isEmptyResponse(response = {}) {
	  const {
	    prefetch = {}
	  } = response;
	  const {
	    execute = {}
	  } = response;
	  const {
	    pageLoad: executePageLoad = {}
	  } = execute;
	  const {
	    mboxes: executeMboxes = []
	  } = execute;
	  const {
	    pageLoad: prefetchPageLoad = {}
	  } = prefetch;
	  const {
	    views = []
	  } = prefetch;
	  const {
	    mboxes: prefetchMboxes = []
	  } = prefetch;
	  return isEmpty(executePageLoad) && isEmpty(executeMboxes) && isEmpty(prefetchPageLoad) && isEmpty(views) && isEmpty(prefetchMboxes);
	}
	function executeApplyOffers(options, skipPrehiding = false) {
	  const {
	    selector,
	    response
	  } = options;
	  if (isEmptyResponse(response)) {
	    logDebug(NO_ACTIONS);
	    showElement(selector);
	    removeHidingSnippetStyle();
	    notifyRenderingNoOffers({});
	    publish(NO_OFFERS_EVENT);
	    return resolve$1();
	  }
	  const renderingContext = createRenderingContext(selector, response);
	  const redirect = getRedirect(renderingContext);
	  if (!isEmpty(redirect)) {
	    const {
	      url
	    } = redirect;
	    logDebug(REDIRECT_ACTION, redirect);
	    notifyRenderingRedirect({
	      url
	    });
	    publish(REDIRECT_OFFER_EVENT);
	    executeRedirect(window, url);
	    return resolve$1();
	  }
	  notifyRenderingStart({});
	  persistViewsIfPresent(renderingContext);
	  publish(CACHE_UPDATED_EVENT);
	  hidePageLoadOptions(renderingContext, skipPrehiding);
	  return renderContext(renderingContext).then(execution => {
	    if (isEmpty(execution)) {
	      return;
	    }
	    notifyRenderingSucceeded({
	      execution
	    });
	  })['catch'](error => notifyRenderingFailed({
	    error
	  }));
	}

	function hasServerState(config) {
	  const serverState = config[SERVER_STATE];
	  if (isEmpty(serverState)) {
	    return false;
	  }
	  const {
	    request,
	    response
	  } = serverState;
	  if (isEmpty(request)) {
	    return false;
	  }
	  if (isEmpty(response)) {
	    return false;
	  }
	  return true;
	}
	function getServerState(config) {
	  return config[SERVER_STATE];
	}

	const Messages = {
	  ERROR_MAX_RETRY: (numRetries, errString) => "Unable to retrieve artifact after " + numRetries + " retries: " + errString,
	  ARTIFACT_NOT_AVAILABLE: "The decisioning artifact is not available",
	  ARTIFACT_VERSION_UNSUPPORTED: (artifactVersion, supportedMajorVersion) => "The decisioning artifact version (" + artifactVersion + ") is not supported. This library is compatible with this major version: " + supportedMajorVersion,
	  ARTIFACT_FETCH_ERROR: reason => "Failed to retrieve artifact: " + reason,
	  ARTIFACT_INVALID: "Invalid Artifact",
	  INVALID_ENVIRONMENT: (expectedEnvironment, defaultEnvironment) => "'" + expectedEnvironment + "' is not a valid target environment, defaulting to '" + defaultEnvironment + "'.",
	  NOT_APPLICABLE: "Not Applicable",
	  ARTIFACT_OBFUSCATION_ERROR: "Unable to read artifact JSON",
	  UNKNOWN: "unknown"
	};

	const DEFAULT_POLLING_INTERVAL = 300000;
	const MINIMUM_POLLING_INTERVAL = 300000;
	const NUM_FETCH_RETRIES = 10;
	const SUPPORTED_ARTIFACT_MAJOR_VERSION = 1;
	const SUPPORTED_ARTIFACT_OBFUSCATION_VERSION = 1;
	const REGEX_ARTIFACT_FILENAME_BINARY = /.+\.bin$/i;
	const ARTIFACT_FORMAT_BINARY = "bin";
	const ARTIFACT_FORMAT_JSON = "json";
	const ARTIFACT_FORMAT_DEFAULT = ARTIFACT_FORMAT_JSON;
	const ARTIFACT_FORMATS = [ARTIFACT_FORMAT_BINARY, ARTIFACT_FORMAT_JSON];
	const ARTIFACT_FILENAME = {};
	ARTIFACT_FILENAME[ARTIFACT_FORMAT_BINARY] = "rules.bin";
	ARTIFACT_FILENAME[ARTIFACT_FORMAT_JSON] = "rules.json";
	const LOG_PREFIX$1 = "LD";
	const CDN_BASE_PROD = "assets.adobetarget.com";
	const CDN_BASE_STAGE = "assets.staging.adobetarget.com";
	const CDN_BASE_DEV = "assets.staging.adobetarget.com";
	const HTTP_HEADER_FORWARDED_FOR = "x-forwarded-for";
	const HTTP_HEADER_GEO_LATITUDE = "x-geo-latitude";
	const HTTP_HEADER_GEO_LONGITUDE = "x-geo-longitude";
	const HTTP_HEADER_GEO_COUNTRY = "x-geo-country-code";
	const HTTP_HEADER_GEO_REGION = "x-geo-region-code";
	const HTTP_HEADER_GEO_CITY = "x-geo-city";
	const CDN_BASE = {};
	CDN_BASE[ENVIRONMENT_PROD] = CDN_BASE_PROD;
	CDN_BASE[ENVIRONMENT_STAGE] = CDN_BASE_STAGE;
	CDN_BASE[ENVIRONMENT_DEV] = CDN_BASE_DEV;
	const CAMPAIGN_BUCKET_SALT = "0";
	const AUDIENCE_IDS = "audience.ids";
	const ACTIVITY_DECISIONING_METHOD = "activity.decisioningMethod";
	const ACTIVITY_ID = "activity.id";
	const ACTIVITY_NAME = "activity.name";
	const ACTIVITY_TYPE = "activity.type";
	const EXPERIENCE_ID = "experience.id";
	const EXPERIENCE_NAME = "experience.name";
	const LOCATION_ID = "location.id";
	const LOCATION_NAME = "location.name";
	const LOCATION_TYPE = "location.type";
	const OFFER_ID = "offer.id";
	const OFFER_NAME = "offer.name";
	const OPTION_ID = "option.id";
	const OPTION_NAME = "option.name";
	const GEO_CITY = "geo.city";
	const GEO_COUNTRY = "geo.country";
	const GEO_STATE = "geo.state";
	const GEO_LATITUDE = "geo.latitude";
	const GEO_LONGITUDE = "geo.longitude";

	function getRuleKey(rule) {
	  return rule.ruleKey;
	}
	function parseURL(url) {
	  if (!isString(url)) {
	    url = "";
	  }
	  const parsed = parseUri(url) || {};
	  const {
	    host = "",
	    path = "",
	    query = "",
	    anchor = ""
	  } = parsed;
	  const result = {
	    url,
	    path,
	    query,
	    fragment: anchor
	  };
	  const domainParts = host.split(".");
	  switch (domainParts.length) {
	    case 1:
	      result.subdomain = "";
	      result.domain = host;
	      result.topLevelDomain = "";
	      break;
	    case 2:
	      result.subdomain = "";
	      result.domain = host;
	      result.topLevelDomain = domainParts[1];
	      break;
	    case 3:
	      result.subdomain = domainParts[0] === "www" ? "" : domainParts[0];
	      result.domain = host;
	      result.topLevelDomain = domainParts[2];
	      break;
	    case 4:
	      result.subdomain = domainParts[0] === "www" ? "" : domainParts[0];
	      result.domain = host;
	      result.topLevelDomain = domainParts[2] + "." + domainParts[3];
	      break;
	  }
	  return result;
	}
	function hasRemoteDependency(artifact, request) {
	  if (isUndefined(artifact)) {
	    throw new Error(Messages.ARTIFACT_NOT_AVAILABLE);
	  }
	  const requestedMboxes = Array.from(getMboxNames(request));
	  const requestedViews = Array.from(getViewNames(request));
	  const {
	    remoteMboxes = [],
	    localMboxes = [],
	    remoteViews = [],
	    localViews = []
	  } = artifact;
	  const mboxesThatRequireRemote = new Set([...remoteMboxes.filter(mboxName => includes(mboxName, requestedMboxes)), ...requestedMboxes.filter(mboxName => !includes(mboxName, localMboxes))]);
	  const viewsThatRequireRemote = hasRequestedViews(request) && requestedViews.length === 0 ? new Set(remoteViews) : new Set([...remoteViews.filter(viewName => includes(viewName, requestedViews)), ...requestedViews.filter(viewName => !includes(viewName, localViews))]);
	  return {
	    remoteNeeded: mboxesThatRequireRemote.size > 0 || viewsThatRequireRemote.size > 0,
	    remoteMboxes: Array.from(mboxesThatRequireRemote),
	    remoteViews: Array.from(viewsThatRequireRemote)
	  };
	}
	function matchMajorVersion(semanticVersion, majorVersion) {
	  const [major, minor, patch] = semanticVersion.split(".").map(value => parseInt(value, 10));
	  return majorVersion === major;
	}
	function cloneDeep(obj) {
	  if (isDefined(obj)) {
	    return JSON.parse(JSON.stringify(obj));
	  }
	  return undefined;
	}
	function getValidEnvironment(environmentName, logger) {
	  const isValid = includes(environmentName, POSSIBLE_ENVIRONMENTS);
	  if (!isValid) {
	    getLogger(logger).debug(Messages.INVALID_ENVIRONMENT(environmentName, ENVIRONMENT_PROD));
	  }
	  return isValid ? environmentName : ENVIRONMENT_PROD;
	}
	function getTargetEnvironment(config) {
	  const {
	    environment = ENVIRONMENT_PROD
	  } = config;
	  return getValidEnvironment(environment, config.logger);
	}
	function getCdnEnvironment(config) {
	  const {
	    cdnEnvironment = ENVIRONMENT_PROD
	  } = config;
	  return getValidEnvironment(cdnEnvironment, config.logger);
	}
	function getCdnBasePath(config) {
	  let {
	    cdnBasePath
	  } = config;
	  if (!isDefined(cdnBasePath)) {
	    const cdnEnvironment = getCdnEnvironment(config);
	    const env = includes(cdnEnvironment, POSSIBLE_ENVIRONMENTS) ? cdnEnvironment : ENVIRONMENT_PROD;
	    cdnBasePath = CDN_BASE[env];
	  }
	  return "https://" + cdnBasePath;
	}
	function getArtifactFileName(artifactFormat = ARTIFACT_FORMAT_DEFAULT) {
	  artifactFormat = includes(artifactFormat, ARTIFACT_FORMATS) ? artifactFormat : ARTIFACT_FORMAT_DEFAULT;
	  return ARTIFACT_FILENAME[artifactFormat];
	}
	function getGeoLookupPath(config) {
	  const cdnBasePath = getCdnBasePath(config);
	  return cdnBasePath + "/v" + SUPPORTED_ARTIFACT_MAJOR_VERSION + "/geo";
	}
	function determineArtifactLocation(config, addPropertyToken = isBrowser()) {
	  const {
	    client,
	    propertyToken,
	    artifactFormat,
	    artifactLocation
	  } = config;
	  if (isString(artifactLocation)) {
	    return artifactLocation;
	  }
	  const targetEnvironment = getTargetEnvironment(config);
	  return [getCdnBasePath(config), client, targetEnvironment, "v" + SUPPORTED_ARTIFACT_MAJOR_VERSION, addPropertyToken ? propertyToken : undefined, getArtifactFileName(artifactFormat)].filter(value => isDefined(value)).join("/");
	}
	function determineArtifactFormat(artifactLocation) {
	  return artifactLocation.match(REGEX_ARTIFACT_FILENAME_BINARY) != null ? ARTIFACT_FORMAT_BINARY : ARTIFACT_FORMAT_JSON;
	}
	function firstMatch(key, searchObjects = [], defaultValue = undefined) {
	  for (let i = 0; i < searchObjects.length; i += 1) {
	    const haystack = searchObjects[i];
	    if (isObject(haystack) && isDefined(haystack[key])) {
	      return haystack[key];
	    }
	  }
	  return defaultValue;
	}

	const EMPTY_CONTEXT = {
	  channel: ChannelType.Web
	};
	function getLowerCaseAttributes(obj) {
	  const result = {};
	  Object.keys(obj).forEach(key => {
	    result[key + "_lc"] = isString(obj[key]) ? obj[key].toLowerCase() : obj[key];
	  });
	  return result;
	}
	function createBrowserContext(context) {
	  const {
	    userAgent = ""
	  } = context;
	  const browser = browserFromUserAgent(userAgent);
	  const platform = operatingSystemFromUserAgent(userAgent);
	  return {
	    browserType: browser.name.toLowerCase(),
	    platform,
	    locale: "en",
	    browserVersion: browser.version
	  };
	}
	function createUrlContext(url) {
	  if (!url || !isString(url)) {
	    url = "";
	  }
	  const urlAttributes = parseURL(url);
	  return _objectSpread2(_objectSpread2({}, urlAttributes), getLowerCaseAttributes(urlAttributes));
	}
	function createPageContext(address) {
	  return createUrlContext(address ? address.url : "");
	}
	function createReferringContext(address) {
	  return createUrlContext(address ? address.referringUrl : "");
	}
	function createMboxContext(mboxRequest) {
	  if (!mboxRequest) {
	    return {};
	  }
	  const parameters = mboxRequest.parameters || {};
	  return _objectSpread2(_objectSpread2({}, parameters), getLowerCaseAttributes(parameters));
	}
	function createGeoContext(geoContext = {}) {
	  return {
	    country: geoContext.countryCode,
	    region: geoContext.stateCode,
	    city: geoContext.city,
	    latitude: geoContext.latitude,
	    longitude: geoContext.longitude
	  };
	}
	function createTimingContext() {
	  const now = new Date();
	  const twoDigitString = value => value < 10 ? "0" + value : String(value);
	  const currentHours = twoDigitString(now.getUTCHours());
	  const currentMinutes = twoDigitString(now.getUTCMinutes());
	  const currentTime = "" + currentHours + currentMinutes;
	  const currentDay = now.getUTCDay();
	  return {
	    current_timestamp: now.getTime(),
	    current_time: currentTime,
	    current_day: currentDay === 0 ? 7 : currentDay
	  };
	}
	function createDecisioningContext(deliveryRequest) {
	  const {
	    context = EMPTY_CONTEXT
	  } = deliveryRequest;
	  return _objectSpread2(_objectSpread2({}, createTimingContext()), {}, {
	    user: createBrowserContext(context),
	    page: createPageContext(context.address),
	    referring: createReferringContext(context.address),
	    geo: createGeoContext(context.geo || {})
	  });
	}

	const LOG_TAG = LOG_PREFIX$1 + ".NotificationProvider";
	function NotificationProvider(request, visitor, logger, sendNotificationFunc = noop, telemetryEnabled = true) {
	  const {
	    requestId
	  } = request;
	  const timestamp = now();
	  const prevEventKeys = new Set();
	  let notifications = [];
	  let telemetryEntries = [];
	  function addNotification(mbox, traceFn = noop) {
	    const displayTokens = [];
	    mbox.options.forEach(option => {
	      const {
	        eventToken
	      } = option;
	      const eventKey = mbox.name + "-" + eventToken;
	      if (isDefined(eventToken) && !prevEventKeys.has(eventKey)) {
	        displayTokens.push(eventToken);
	        prevEventKeys.add(eventKey);
	      }
	    });
	    if (displayTokens.length === 0) {
	      return;
	    }
	    const notification = {
	      id: uuid(),
	      impressionId: uuid(),
	      timestamp,
	      type: MetricType.Display,
	      mbox: {
	        name: mbox.name
	      },
	      tokens: displayTokens
	    };
	    if (isFunction(traceFn)) {
	      traceFn(notification);
	    }
	    notifications.push(notification);
	  }
	  function addTelemetryEntry(entry) {
	    if (!telemetryEnabled) {
	      return;
	    }
	    telemetryEntries.push(_objectSpread2({
	      requestId,
	      timestamp,
	      features: {
	        decisioningMethod: DECISIONING_METHOD.ON_DEVICE
	      }
	    }, entry));
	  }
	  function sendNotifications() {
	    logger.debug(LOG_TAG + ".sendNotifications", notifications, telemetryEntries);
	    if (notifications.length > 0 || telemetryEntries.length > 0) {
	      const {
	        id,
	        context,
	        experienceCloud
	      } = request;
	      const notification = {
	        request: {
	          id,
	          context,
	          experienceCloud
	        },
	        visitor
	      };
	      if (notifications.length > 0) {
	        notification.request.notifications = notifications;
	      }
	      if (telemetryEntries.length > 0) {
	        notification.request.telemetry = {
	          entries: telemetryEntries
	        };
	      }
	      setTimeout(() => sendNotificationFunc.call(null, notification), 0);
	      notifications = [];
	      telemetryEntries = [];
	    }
	  }
	  return {
	    addNotification,
	    addTelemetryEntry,
	    sendNotifications
	  };
	}

	const byOrder = (a, b) => a.order - b.order;
	function TraceProvider(config, targetOptions, artifactTrace) {
	  const clientCode = config.client;
	  const {
	    sessionId,
	    request
	  } = targetOptions;
	  const showTraces = isDefined(request.trace);
	  const [tntId, profileLocation] = isDefined(request.id) && isString(request.id.tntId) ? request.id.tntId.split(".") : [undefined, undefined];
	  const profile = {
	    visitorId: _objectSpread2(_objectSpread2({}, request.id), {}, {
	      tntId,
	      profileLocation
	    })
	  };
	  function wrap(traceResult) {
	    if (!showTraces) {
	      return undefined;
	    }
	    return {
	      clientCode,
	      artifact: artifactTrace,
	      profile,
	      request: _objectSpread2({
	        sessionId
	      }, traceResult.request),
	      campaigns: traceResult.campaigns,
	      evaluatedCampaignTargets: traceResult.evaluatedCampaignTargets
	    };
	  }
	  return {
	    wrap
	  };
	}
	function RequestTracer(traceProvider, artifact) {
	  let request = {};
	  const campaigns = {};
	  let campaignOrder = 0;
	  const evaluatedCampaignTargets = {};
	  let evaluatedCampaignTargetOrder = 0;
	  function traceRequest(mode, requestType, mboxRequest, context) {
	    request = {
	      pageURL: context.page.url,
	      host: context.page.domain
	    };
	    request[requestType] = _objectSpread2(_objectSpread2({}, mboxRequest), {}, {
	      type: mode
	    });
	  }
	  function addCampaign(rule, ruleSatisfied) {
	    const {
	      meta
	    } = rule;
	    const activityId = meta[ACTIVITY_ID];
	    if (ruleSatisfied && isUndefined(campaigns[activityId])) {
	      campaignOrder += 1;
	      campaigns[activityId] = {
	        id: activityId,
	        order: campaignOrder,
	        campaignType: meta[ACTIVITY_TYPE],
	        branchId: meta[EXPERIENCE_ID],
	        offers: isDefined(meta[OFFER_ID]) ? [meta[OFFER_ID]] : [],
	        environment: artifact.meta.environment
	      };
	    }
	  }
	  function addEvaluatedCampaignTarget(rule, ruleContext, ruleSatisfied) {
	    const {
	      meta
	    } = rule;
	    const audienceIds = meta[AUDIENCE_IDS];
	    const activityId = meta[ACTIVITY_ID];
	    if (isUndefined(evaluatedCampaignTargets[activityId])) {
	      evaluatedCampaignTargetOrder += 1;
	      evaluatedCampaignTargets[activityId] = {
	        order: evaluatedCampaignTargetOrder,
	        context: ruleContext,
	        campaignId: activityId,
	        campaignType: meta[ACTIVITY_TYPE],
	        matchedSegmentIds: new Set(),
	        unmatchedSegmentIds: new Set(),
	        matchedRuleConditions: [],
	        unmatchedRuleConditions: []
	      };
	    }
	    audienceIds.forEach(audienceId => {
	      evaluatedCampaignTargets[activityId][ruleSatisfied ? "matchedSegmentIds" : "unmatchedSegmentIds"].add(audienceId);
	    });
	    evaluatedCampaignTargets[activityId][ruleSatisfied ? "matchedRuleConditions" : "unmatchedRuleConditions"].push(rule.condition);
	  }
	  function traceRuleEvaluated(rule, mboxRequest, requestType, ruleContext, ruleSatisfied) {
	    addCampaign(rule, ruleSatisfied);
	    addEvaluatedCampaignTarget(rule, ruleContext, ruleSatisfied);
	  }
	  function traceNotification(rule) {
	    const {
	      meta
	    } = rule;
	    const activityId = meta[ACTIVITY_ID];
	    if (!(campaigns[activityId].notifications instanceof Array)) {
	      campaigns[activityId].notifications = [];
	    }
	    return notification => {
	      campaigns[activityId].notifications.push(notification);
	    };
	  }
	  function toJSON() {
	    return {
	      campaigns: values(campaigns).sort(byOrder).map(campaign => {
	        const result = _objectSpread2({}, campaign);
	        delete result.order;
	        return result;
	      }),
	      evaluatedCampaignTargets: values(evaluatedCampaignTargets).sort(byOrder).map(evaluatedCampaignTarget => {
	        const result = _objectSpread2(_objectSpread2({}, evaluatedCampaignTarget), {}, {
	          matchedSegmentIds: [...evaluatedCampaignTarget.matchedSegmentIds],
	          unmatchedSegmentIds: [...evaluatedCampaignTarget.unmatchedSegmentIds]
	        });
	        delete result.order;
	        return result;
	      }),
	      request
	    };
	  }
	  function getTraceResult() {
	    return traceProvider.wrap(toJSON());
	  }
	  return {
	    toJSON,
	    traceRuleEvaluated,
	    traceRequest,
	    traceNotification,
	    getTraceResult
	  };
	}
	function ArtifactTracer(artifactLocation, artifactPayload, pollingInterval, pollingHalted, firstArtifact) {
	  let artifact = firstArtifact;
	  let artifactRetrievalCount = 1;
	  let artifactLastRetrieved = new Date();
	  function provideNewArtifact(value) {
	    artifactLastRetrieved = new Date();
	    artifactRetrievalCount += 1;
	    artifact = value;
	  }
	  const meta = isDefined(artifact) ? artifact.meta : {};
	  function toJSON() {
	    return _objectSpread2({
	      artifactLocation: isObject(artifactPayload) ? Messages.NOT_APPLICABLE : artifactLocation,
	      pollingInterval,
	      pollingHalted,
	      artifactVersion: isDefined(artifact) ? artifact.version : Messages.UNKNOWN,
	      artifactRetrievalCount,
	      artifactLastRetrieved: artifactLastRetrieved.toISOString()
	    }, meta);
	  }
	  return {
	    provideNewArtifact,
	    toJSON
	  };
	}

	const RequestType = {
	  MBOX: "mbox",
	  VIEW: "view",
	  PAGELOAD: "pageLoad"
	};
	const OptionType = {
	  Html: "html",
	  Json: "json",
	  Redirect: "redirect",
	  Dynamic: "dynamic",
	  Actions: "actions"
	};

	const MACRO_PATTERN_REGEX = /\$\{([a-zA-Z0-9_.]*?)\}/gi;
	const MACRO_NAME_REPLACEMENTS = {
	  campaign: "activity",
	  recipe: "experience"
	};
	const MACRO_NAME_REPLACEMENTS_REGEX = new RegExp(Object.keys(MACRO_NAME_REPLACEMENTS).join("|"), "gi");
	const MACRO_NAME_REMOVALS = ["mbox"];
	function noBlankOptions(option) {
	  return !(isUndefined(option.type) && isUndefined(option.content));
	}
	function prepareExecuteResponse(rule, mboxResponse, requestType, requestDetail, tracer) {
	  const {
	    metrics = [],
	    options = []
	  } = mboxResponse;
	  const result = _objectSpread2(_objectSpread2({}, mboxResponse), {}, {
	    options: options.filter(noBlankOptions).map(pristineOption => {
	      const option = _objectSpread2({}, pristineOption);
	      delete option.eventToken;
	      return option;
	    }),
	    metrics: metrics.filter(metric => metric.type === MetricType.Click)
	  });
	  if (result.metrics.length === 0) {
	    delete result.metrics;
	  }
	  return result;
	}
	function preparePrefetchResponse(rule, mboxResponse, requestType, requestDetail, tracer) {
	  const {
	    options = []
	  } = mboxResponse;
	  const result = _objectSpread2(_objectSpread2({}, mboxResponse), {}, {
	    options: options.map((pristineOption, idx) => {
	      let {
	        eventToken
	      } = pristineOption;
	      if (isUndefined(eventToken) && mboxResponse.metrics.length > idx && mboxResponse.metrics[idx].type === MetricType.Display) {
	        eventToken = mboxResponse.metrics[idx].eventToken;
	      }
	      return _objectSpread2(_objectSpread2({}, pristineOption), {}, {
	        eventToken
	      });
	    })
	  });
	  if (requestType !== RequestType.VIEW) {
	    delete result.metrics;
	  }
	  return result;
	}
	function addTrace(rule, mboxResponse, requestType, requestDetail, tracer) {
	  return _objectSpread2(_objectSpread2({}, mboxResponse), {}, {
	    trace: tracer.getTraceResult()
	  });
	}
	function cleanUp(rule, mboxResponse, requestType, requestDetail, tracer) {
	  const result = objectWithoutUndefinedValues(mboxResponse);
	  return result;
	}
	function removePageLoadAttributes(rule, mboxResponse, requestType, requestDetail, tracer) {
	  const processed = _objectSpread2({}, mboxResponse);
	  delete processed.index;
	  delete processed.name;
	  delete processed.trace;
	  return processed;
	}
	function createResponseTokensPostProcessor(context, responseTokensInArtifact = []) {
	  const responseTokens = {};
	  responseTokens[ACTIVITY_DECISIONING_METHOD] = "on-device";
	  if (includes(GEO_CITY, responseTokensInArtifact) && isDefined(context.geo.city)) {
	    responseTokens[GEO_CITY] = context.geo.city;
	  }
	  if (includes(GEO_COUNTRY, responseTokensInArtifact) && isDefined(context.geo.country)) {
	    responseTokens[GEO_COUNTRY] = context.geo.country;
	  }
	  if (includes(GEO_STATE, responseTokensInArtifact) && isDefined(context.geo.region)) {
	    responseTokens[GEO_STATE] = context.geo.region;
	  }
	  if (includes(GEO_LATITUDE, responseTokensInArtifact) && isDefined(context.geo.latitude)) {
	    responseTokens[GEO_LATITUDE] = context.geo.latitude;
	  }
	  if (includes(GEO_LONGITUDE, responseTokensInArtifact) && isDefined(context.geo.longitude)) {
	    responseTokens[GEO_LONGITUDE] = context.geo.longitude;
	  }
	  return function addResponseTokens(rule, mboxResponse) {
	    const meta = rule.meta || {};
	    const responseTokensFromMeta = [ACTIVITY_ID, ACTIVITY_NAME, ACTIVITY_TYPE, EXPERIENCE_ID, EXPERIENCE_NAME, LOCATION_ID, LOCATION_NAME, LOCATION_TYPE, OFFER_ID, OFFER_NAME, OPTION_ID, OPTION_NAME].reduce((accumulator, key) => {
	      if (includes(key, responseTokensInArtifact) && isDefined(meta[key])) {
	        accumulator[key] = meta[key];
	      }
	      return accumulator;
	    }, {});
	    const options = mboxResponse.options.map(option => {
	      return _objectSpread2(_objectSpread2({}, option), {}, {
	        responseTokens: _objectSpread2(_objectSpread2({}, responseTokensFromMeta), responseTokens)
	      });
	    });
	    return _objectSpread2(_objectSpread2({}, mboxResponse), {}, {
	      options
	    });
	  };
	}
	function replaceCampaignMacros(rule, mboxResponse, requestType, requestDetail, tracer) {
	  function addCampainMacroValues(htmlContent) {
	    if (isUndefined(htmlContent) || !isString(htmlContent)) {
	      return htmlContent;
	    }
	    return htmlContent.replace(MACRO_PATTERN_REGEX, (defaultValue, macroKey) => {
	      let parts = macroKey.replace(MACRO_NAME_REPLACEMENTS_REGEX, matched => MACRO_NAME_REPLACEMENTS[matched]).split(".");
	      if (parts.length > 2) {
	        parts = parts.slice(parts.length - 2);
	      }
	      const key = parts.filter(part => !includes(part, MACRO_NAME_REMOVALS)).join(".");
	      const {
	        parameters = {}
	      } = requestDetail;
	      return firstMatch(key, [rule.meta, requestDetail, parameters], defaultValue);
	    });
	  }
	  return _objectSpread2(_objectSpread2({}, mboxResponse), {}, {
	    options: mboxResponse.options.map(
	    option => {
	      if (option.type === OptionType.Html) {
	        return _objectSpread2(_objectSpread2({}, option), {}, {
	          content: addCampainMacroValues(option.content)
	        });
	      }
	      if (option.type === OptionType.Actions) {
	        return _objectSpread2(_objectSpread2({}, option), {}, {
	          content: option.content.map(action => {
	            return _objectSpread2(_objectSpread2({}, action), {}, {
	              content: addCampainMacroValues(action.content)
	            });
	          })
	        });
	      }
	      return option;
	    })
	  });
	}

	var logic = createCommonjsModule(function (module, exports) {
	  (function (root, factory) {
	    {
	      module.exports = factory();
	    }
	  })(commonjsGlobal, function () {
	    if (!Array.isArray) {
	      Array.isArray = function (arg) {
	        return Object.prototype.toString.call(arg) === "[object Array]";
	      };
	    }
	    function arrayUnique(array) {
	      var a = [];
	      for (var i = 0, l = array.length; i < l; i++) {
	        if (a.indexOf(array[i]) === -1) {
	          a.push(array[i]);
	        }
	      }
	      return a;
	    }
	    var jsonLogic = {};
	    var operations = {
	      "==": function (a, b) {
	        return a == b;
	      },
	      "===": function (a, b) {
	        return a === b;
	      },
	      "!=": function (a, b) {
	        return a != b;
	      },
	      "!==": function (a, b) {
	        return a !== b;
	      },
	      ">": function (a, b) {
	        return a > b;
	      },
	      ">=": function (a, b) {
	        return a >= b;
	      },
	      "<": function (a, b, c) {
	        return c === undefined ? a < b : a < b && b < c;
	      },
	      "<=": function (a, b, c) {
	        return c === undefined ? a <= b : a <= b && b <= c;
	      },
	      "!!": function (a) {
	        return jsonLogic.truthy(a);
	      },
	      "!": function (a) {
	        return !jsonLogic.truthy(a);
	      },
	      "%": function (a, b) {
	        return a % b;
	      },
	      "log": function (a) {
	        console.log(a);
	        return a;
	      },
	      "in": function (a, b) {
	        if (!b || typeof b.indexOf === "undefined") return false;
	        return b.indexOf(a) !== -1;
	      },
	      "cat": function () {
	        return Array.prototype.join.call(arguments, "");
	      },
	      "substr": function (source, start, end) {
	        if (end < 0) {
	          var temp = String(source).substr(start);
	          return temp.substr(0, temp.length + end);
	        }
	        return String(source).substr(start, end);
	      },
	      "+": function () {
	        return Array.prototype.reduce.call(arguments, function (a, b) {
	          return parseFloat(a, 10) + parseFloat(b, 10);
	        }, 0);
	      },
	      "*": function () {
	        return Array.prototype.reduce.call(arguments, function (a, b) {
	          return parseFloat(a, 10) * parseFloat(b, 10);
	        });
	      },
	      "-": function (a, b) {
	        if (b === undefined) {
	          return -a;
	        } else {
	          return a - b;
	        }
	      },
	      "/": function (a, b) {
	        return a / b;
	      },
	      "min": function () {
	        return Math.min.apply(this, arguments);
	      },
	      "max": function () {
	        return Math.max.apply(this, arguments);
	      },
	      "merge": function () {
	        return Array.prototype.reduce.call(arguments, function (a, b) {
	          return a.concat(b);
	        }, []);
	      },
	      "var": function (a, b) {
	        var not_found = b === undefined ? null : b;
	        var data = this;
	        if (typeof a === "undefined" || a === "" || a === null) {
	          return data;
	        }
	        var sub_props = String(a).split(".");
	        for (var i = 0; i < sub_props.length; i++) {
	          if (data === null || data === undefined) {
	            return not_found;
	          }
	          data = data[sub_props[i]];
	          if (data === undefined) {
	            return not_found;
	          }
	        }
	        return data;
	      },
	      "missing": function () {
	        var missing = [];
	        var keys = Array.isArray(arguments[0]) ? arguments[0] : arguments;
	        for (var i = 0; i < keys.length; i++) {
	          var key = keys[i];
	          var value = jsonLogic.apply({
	            "var": key
	          }, this);
	          if (value === null || value === "") {
	            missing.push(key);
	          }
	        }
	        return missing;
	      },
	      "missing_some": function (need_count, options) {
	        var are_missing = jsonLogic.apply({
	          "missing": options
	        }, this);
	        if (options.length - are_missing.length >= need_count) {
	          return [];
	        } else {
	          return are_missing;
	        }
	      }
	    };
	    jsonLogic.is_logic = function (logic) {
	      return typeof logic === "object" &&
	      logic !== null &&
	      !Array.isArray(logic) &&
	      Object.keys(logic).length === 1
	      ;
	    };
	    jsonLogic.truthy = function (value) {
	      if (Array.isArray(value) && value.length === 0) {
	        return false;
	      }
	      return !!value;
	    };
	    jsonLogic.get_operator = function (logic) {
	      return Object.keys(logic)[0];
	    };
	    jsonLogic.get_values = function (logic) {
	      return logic[jsonLogic.get_operator(logic)];
	    };
	    jsonLogic.apply = function (logic, data) {
	      if (Array.isArray(logic)) {
	        return logic.map(function (l) {
	          return jsonLogic.apply(l, data);
	        });
	      }
	      if (!jsonLogic.is_logic(logic)) {
	        return logic;
	      }
	      var op = jsonLogic.get_operator(logic);
	      var values = logic[op];
	      var i;
	      var current;
	      var scopedLogic, scopedData, filtered, initial;
	      if (!Array.isArray(values)) {
	        values = [values];
	      }
	      if (op === "if" || op == "?:") {
	        for (i = 0; i < values.length - 1; i += 2) {
	          if (jsonLogic.truthy(jsonLogic.apply(values[i], data))) {
	            return jsonLogic.apply(values[i + 1], data);
	          }
	        }
	        if (values.length === i + 1) return jsonLogic.apply(values[i], data);
	        return null;
	      } else if (op === "and") {
	        for (i = 0; i < values.length; i += 1) {
	          current = jsonLogic.apply(values[i], data);
	          if (!jsonLogic.truthy(current)) {
	            return current;
	          }
	        }
	        return current;
	      } else if (op === "or") {
	        for (i = 0; i < values.length; i += 1) {
	          current = jsonLogic.apply(values[i], data);
	          if (jsonLogic.truthy(current)) {
	            return current;
	          }
	        }
	        return current;
	      } else if (op === 'filter') {
	        scopedData = jsonLogic.apply(values[0], data);
	        scopedLogic = values[1];
	        if (!Array.isArray(scopedData)) {
	          return [];
	        }
	        return scopedData.filter(function (datum) {
	          return jsonLogic.truthy(jsonLogic.apply(scopedLogic, datum));
	        });
	      } else if (op === 'map') {
	        scopedData = jsonLogic.apply(values[0], data);
	        scopedLogic = values[1];
	        if (!Array.isArray(scopedData)) {
	          return [];
	        }
	        return scopedData.map(function (datum) {
	          return jsonLogic.apply(scopedLogic, datum);
	        });
	      } else if (op === 'reduce') {
	        scopedData = jsonLogic.apply(values[0], data);
	        scopedLogic = values[1];
	        initial = typeof values[2] !== 'undefined' ? values[2] : null;
	        if (!Array.isArray(scopedData)) {
	          return initial;
	        }
	        return scopedData.reduce(function (accumulator, current) {
	          return jsonLogic.apply(scopedLogic, {
	            'current': current,
	            'accumulator': accumulator
	          });
	        }, initial);
	      } else if (op === "all") {
	        scopedData = jsonLogic.apply(values[0], data);
	        scopedLogic = values[1];
	        if (!scopedData.length) {
	          return false;
	        }
	        for (i = 0; i < scopedData.length; i += 1) {
	          if (!jsonLogic.truthy(jsonLogic.apply(scopedLogic, scopedData[i]))) {
	            return false;
	          }
	        }
	        return true;
	      } else if (op === "none") {
	        filtered = jsonLogic.apply({
	          'filter': values
	        }, data);
	        return filtered.length === 0;
	      } else if (op === "some") {
	        filtered = jsonLogic.apply({
	          'filter': values
	        }, data);
	        return filtered.length > 0;
	      }
	      values = values.map(function (val) {
	        return jsonLogic.apply(val, data);
	      });
	      if (typeof operations[op] === "function") {
	        return operations[op].apply(data, values);
	      } else if (op.indexOf(".") > 0) {
	        var sub_ops = String(op).split(".");
	        var operation = operations;
	        for (i = 0; i < sub_ops.length; i++) {
	          operation = operation[sub_ops[i]];
	          if (operation === undefined) {
	            throw new Error("Unrecognized operation " + op + " (failed at " + sub_ops.slice(0, i + 1).join(".") + ")");
	          }
	        }
	        return operation.apply(data, values);
	      }
	      throw new Error("Unrecognized operation " + op);
	    };
	    jsonLogic.uses_data = function (logic) {
	      var collection = [];
	      if (jsonLogic.is_logic(logic)) {
	        var op = jsonLogic.get_operator(logic);
	        var values = logic[op];
	        if (!Array.isArray(values)) {
	          values = [values];
	        }
	        if (op === "var") {
	          collection.push(values[0]);
	        } else {
	          values.map(function (val) {
	            collection.push.apply(collection, jsonLogic.uses_data(val));
	          });
	        }
	      }
	      return arrayUnique(collection);
	    };
	    jsonLogic.add_operation = function (name, code) {
	      operations[name] = code;
	    };
	    jsonLogic.rm_operation = function (name) {
	      delete operations[name];
	    };
	    jsonLogic.rule_like = function (rule, pattern) {
	      if (pattern === rule) {
	        return true;
	      }
	      if (pattern === "@") {
	        return true;
	      }
	      if (pattern === "number") {
	        return typeof rule === "number";
	      }
	      if (pattern === "string") {
	        return typeof rule === "string";
	      }
	      if (pattern === "array") {
	        return Array.isArray(rule) && !jsonLogic.is_logic(rule);
	      }
	      if (jsonLogic.is_logic(pattern)) {
	        if (jsonLogic.is_logic(rule)) {
	          var pattern_op = jsonLogic.get_operator(pattern);
	          var rule_op = jsonLogic.get_operator(rule);
	          if (pattern_op === "@" || pattern_op === rule_op) {
	            return jsonLogic.rule_like(jsonLogic.get_values(rule, false), jsonLogic.get_values(pattern, false));
	          }
	        }
	        return false;
	      }
	      if (Array.isArray(pattern)) {
	        if (Array.isArray(rule)) {
	          if (pattern.length !== rule.length) {
	            return false;
	          }
	          for (var i = 0; i < pattern.length; i += 1) {
	            if (!jsonLogic.rule_like(rule[i], pattern[i])) {
	              return false;
	            }
	          }
	          return true;
	        } else {
	          return false;
	        }
	      }
	      return false;
	    };
	    return jsonLogic;
	  });
	});

	const TOTAL_BUCKETS = 10000;
	const MAX_PERCENTAGE = 100;
	function validTntId(tntId = "") {
	  if (isString(tntId) && !isEmpty(tntId)) {
	    const [id, locationHint] = tntId.split(".");
	    return id;
	  }
	  return undefined;
	}
	function getOrCreateVisitorId(visitorId) {
	  if (visitorId) {
	    return visitorId.marketingCloudVisitorId || validTntId(visitorId.tntId) || visitorId.thirdPartyId || uuid()
	    ;
	  }
	  return uuid();
	}
	function calculateAllocation(deviceId) {
	  const signedNumericHashValue = hashUnencodedChars(deviceId);
	  const hashFixedBucket = Math.abs(signedNumericHashValue) % TOTAL_BUCKETS;
	  const allocationValue = hashFixedBucket / TOTAL_BUCKETS * MAX_PERCENTAGE;
	  return Math.round(allocationValue * 100) / 100;
	}
	const calculateAllocationMemoized = memoize(calculateAllocation);
	function computeAllocation(clientId, activityId, visitorId, salt = CAMPAIGN_BUCKET_SALT) {
	  const deviceId = [clientId, activityId, isString(visitorId) && !isEmpty(visitorId) ? visitorId : getOrCreateVisitorId(visitorId), salt].join(".");
	  return calculateAllocationMemoized(deviceId);
	}

	function ruleEvaluator(clientId, visitorId) {
	  const visitorIdString = getOrCreateVisitorId(visitorId);
	  return function processRule(rule, context, requestType, requestDetail, postProcessors, tracer) {
	    let consequence;
	    let {
	      page,
	      referring
	    } = context;
	    if (isDefined(requestDetail.address)) {
	      page = createPageContext(requestDetail.address) || page;
	      referring = createPageContext(requestDetail.address) || referring;
	    }
	    const ruleContext = _objectSpread2(_objectSpread2({}, context), {}, {
	      page,
	      referring,
	      mbox: createMboxContext(requestDetail),
	      allocation: computeAllocation(clientId, rule.meta[ACTIVITY_ID], visitorIdString)
	    });
	    const ruleSatisfied = logic.apply(rule.condition, ruleContext);
	    tracer.traceRuleEvaluated(rule, requestDetail, requestType, ruleContext, ruleSatisfied);
	    if (ruleSatisfied) {
	      consequence = _objectSpread2(_objectSpread2({}, rule.consequence), {}, {
	        index: requestDetail.index
	      });
	      postProcessors.forEach(postProcessFunc => {
	        consequence = postProcessFunc(rule, consequence, requestType, requestDetail, tracer);
	      });
	    }
	    return cloneDeep(consequence);
	  };
	}

	function byPropertyToken(propertyToken) {
	  function filter(rule) {
	    const {
	      propertyTokens = []
	    } = rule;
	    return isUndefined(propertyToken) ? propertyTokens.length === 0 : propertyTokens.length === 0 || includes(propertyToken, propertyTokens);
	  }
	  return filter;
	}

	const TIMING_GET_OFFER = "get_offer";
	const TIMING_ARTIFACT_DOWNLOADED_TOTAL = "artifactDownloaded_total";
	const TIMING_ARTIFACT_DOWNLOADED_FETCH = "artifactDownloaded_fetch";
	const TIMING_ARTIFACT_GET_INITIAL = "artifactGetInitial";
	const TIMING_ARTIFACT_READ_JSON = "artifactDownloaded_read_JSON";
	const TIMING_ARTIFACT_DEOBFUSCATE = "deobfuscate_total";

	const LOG_TAG$1 = LOG_PREFIX$1 + ".DecisionProvider";
	const PARTIAL_CONTENT = 206;
	const OK = 200;
	function DecisionProvider(config, targetOptions, context, artifact, logger, traceProvider) {
	  const timingTool = createPerfToolInstance();
	  timingTool.timeStart(TIMING_GET_OFFER);
	  const {
	    responseTokens,
	    rules
	  } = artifact;
	  const globalMboxName = artifact.globalMbox || DEFAULT_GLOBAL_MBOX;
	  const clientId = config.client;
	  const {
	    request,
	    visitor
	  } = targetOptions;
	  const propertyToken = getPropertyToken(request.property);
	  const {
	    sendNotificationFunc,
	    telemetryEnabled = true
	  } = config;
	  const visitorId = request.id;
	  const processRule = ruleEvaluator(clientId, visitorId);
	  const dependency = hasRemoteDependency(artifact, request);
	  const notificationProvider = NotificationProvider(request, visitor, logger, sendNotificationFunc, telemetryEnabled);
	  function getDecisions(mode, postProcessors) {
	    if (isUndefined(request[mode])) {
	      return undefined;
	    }
	    const requestTracer = RequestTracer(traceProvider, artifact);
	    function processViewRequest(requestDetails, additionalPostProcessors = []) {
	      requestTracer.traceRequest(mode, RequestType.VIEW, requestDetails, context);
	      const consequences = {};
	      let viewRules = [];
	      if (Object.prototype.hasOwnProperty.call(requestDetails, "name") && isDefined(requestDetails.name)) {
	        viewRules = rules.views[requestDetails.name] || [];
	      } else {
	        viewRules = Object.keys(rules.views).reduce((result, key) => [...result, ...rules.views[key]], []);
	      }
	      viewRules = viewRules.filter(byPropertyToken(propertyToken));
	      const matchedRuleKeys = new Set();
	      for (const rule of viewRules) {
	        const ruleKey = getRuleKey(rule);
	        let consequence;
	        if (!matchedRuleKeys.has(ruleKey)) {
	          consequence = processRule(rule, context, RequestType.VIEW, requestDetails, [...postProcessors, ...additionalPostProcessors], requestTracer);
	        }
	        if (consequence) {
	          matchedRuleKeys.add(ruleKey);
	          if (!consequences[consequence.name]) {
	            consequences[consequence.name] = consequence;
	          } else {
	            consequences[consequence.name] = _objectSpread2(_objectSpread2({}, consequences[consequence.name]), {}, {
	              options: [...consequences[consequence.name].options, ...consequence.options],
	              metrics: [...consequences[consequence.name].metrics, ...consequence.metrics]
	            });
	          }
	        }
	      }
	      return values(consequences);
	    }
	    function processMboxRequest(mboxRequest, additionalPostProcessors = []) {
	      const isGlobalMbox = mboxRequest.name === globalMboxName;
	      requestTracer.traceRequest(mode, RequestType.MBOX, mboxRequest, context);
	      const consequences = [];
	      const mboxRules = (rules.mboxes[mboxRequest.name] || []).filter(byPropertyToken(propertyToken));
	      const matchedRuleKeys = new Set();
	      for (const rule of mboxRules) {
	        const ruleKey = getRuleKey(rule);
	        let consequence;
	        if (!isGlobalMbox || isGlobalMbox && !matchedRuleKeys.has(ruleKey)) {
	          consequence = processRule(rule, context, RequestType.MBOX, mboxRequest, [...postProcessors, ...additionalPostProcessors], requestTracer);
	        }
	        if (consequence) {
	          consequences.push(consequence);
	          matchedRuleKeys.add(ruleKey);
	          if (!isGlobalMbox) {
	            break;
	          }
	        }
	      }
	      if (!isGlobalMbox && consequences.length === 0) {
	        consequences.push({
	          name: mboxRequest.name,
	          index: mboxRequest.index,
	          trace: requestTracer.getTraceResult()
	        });
	      }
	      return consequences;
	    }
	    function processPageLoadRequest(requestDetails) {
	      let trace;
	      const consequences = processMboxRequest(_objectSpread2(_objectSpread2({}, requestDetails), {}, {
	        name: globalMboxName
	      }), [function preserveTrace(rule, mboxResponse) {
	        trace = mboxResponse.trace;
	        return mboxResponse;
	      }, removePageLoadAttributes]);
	      const options = flatten(consequences.map(consequence => consequence.options));
	      const result = {
	        options,
	        trace
	      };
	      const indexedMetrics = consequences.reduce((indexed, consequence) => {
	        if (consequence.metrics instanceof Array) {
	          consequence.metrics.forEach(metric => {
	            indexed[metric.eventToken] = metric;
	          });
	        }
	        return indexed;
	      }, {});
	      const metrics = values(indexedMetrics);
	      if (metrics.length > 0) {
	        result.metrics = metrics;
	      }
	      return result;
	    }
	    const response = {};
	    if (request[mode].mboxes) {
	      response.mboxes = flatten(request[mode].mboxes.map(mboxRequest => processMboxRequest(mboxRequest)));
	    }
	    if (request[mode].views) {
	      response.views = flatten(request[mode].views.map(requestDetails => processViewRequest(requestDetails)));
	    }
	    if (request[mode].pageLoad) {
	      response.pageLoad = processPageLoadRequest(request[mode].pageLoad);
	    }
	    return response;
	  }
	  function getExecuteDecisions(postProcessors) {
	    return getDecisions("execute", [function prepareNotification(rule, mboxResponse, requestType, requestDetail, tracer) {
	      notificationProvider.addNotification(mboxResponse, tracer.traceNotification(rule));
	      return mboxResponse;
	    }, prepareExecuteResponse, ...postProcessors]);
	  }
	  function getPrefetchDecisions(postProcessors) {
	    return getDecisions("prefetch", [preparePrefetchResponse, ...postProcessors]);
	  }
	  const addResponseTokens = createResponseTokensPostProcessor(context, responseTokens);
	  const commonPostProcessor = [addResponseTokens, replaceCampaignMacros, addTrace, cleanUp];
	  const response = objectWithoutUndefinedValues({
	    status: dependency.remoteNeeded ? PARTIAL_CONTENT : OK,
	    remoteMboxes: dependency.remoteMboxes,
	    remoteViews: dependency.remoteViews,
	    requestId: request.requestId,
	    id: _objectSpread2({}, request.id),
	    client: clientId,
	    edgeHost: undefined,
	    execute: getExecuteDecisions(commonPostProcessor),
	    prefetch: getPrefetchDecisions(commonPostProcessor)
	  });
	  notificationProvider.addTelemetryEntry({
	    execution: timingTool.timeEnd(TIMING_GET_OFFER)
	  });
	  notificationProvider.sendNotifications();
	  logger.debug("" + LOG_TAG$1, request, response);
	  return Promise.resolve(response);
	}

	const GEO_MAPPINGS = [{
	  headerName: HTTP_HEADER_FORWARDED_FOR,
	  parseValue: value => value,
	  valueKey: "ipAddress"
	}, {
	  headerName: HTTP_HEADER_GEO_LATITUDE,
	  parseValue: value => parseFloat(value),
	  valueKey: "latitude"
	}, {
	  headerName: HTTP_HEADER_GEO_LONGITUDE,
	  parseValue: value => parseFloat(value),
	  valueKey: "longitude"
	}, {
	  headerName: HTTP_HEADER_GEO_COUNTRY,
	  parseValue: value => value,
	  valueKey: "countryCode"
	}, {
	  headerName: HTTP_HEADER_GEO_REGION,
	  parseValue: value => value,
	  valueKey: "stateCode"
	}, {
	  headerName: HTTP_HEADER_GEO_CITY,
	  parseValue: value => value,
	  valueKey: "city"
	}];
	function mapGeoValues(valueFn, initial = {}) {
	  return GEO_MAPPINGS.reduce((result, mapping) => {
	    const value = valueFn.call(null, mapping.headerName);
	    if (value != null && isDefined(value)) {
	      result[mapping.valueKey] = mapping.parseValue(value);
	    }
	    return result;
	  }, initial);
	}
	function createGeoObjectFromHeaders(geoHeaders) {
	  return mapGeoValues(key => geoHeaders.get(key));
	}
	function createGeoObjectFromPayload(geoPayload = {}) {
	  return mapGeoValues(key => geoPayload[key]);
	}
	function GeoProvider(config, artifact) {
	  const fetchApi = getFetchApi(config.fetchApi);
	  const {
	    geoTargetingEnabled = false
	  } = artifact;
	  const {
	    eventEmitter = noop
	  } = config;
	  function validGeoRequestContext(geoRequestContext = {}) {
	    const validatedGeoRequestContext = _objectSpread2({}, geoRequestContext);
	    if (geoRequestContext.ipAddress === UNKNOWN_IP_ADDRESS || !isValidIpAddress(geoRequestContext.ipAddress)) {
	      delete validatedGeoRequestContext.ipAddress;
	    }
	    const geoLookupPath = getGeoLookupPath(config);
	    if (geoTargetingEnabled && (geoRequestContext.ipAddress === UNKNOWN_IP_ADDRESS || isValidIpAddress(geoRequestContext.ipAddress)) && isUndefined(geoRequestContext.latitude) && isUndefined(geoRequestContext.longitude) && isUndefined(geoRequestContext.countryCode) && isUndefined(geoRequestContext.stateCode) && isUndefined(geoRequestContext.city)) {
	      const headers = {};
	      if (geoRequestContext.ipAddress !== UNKNOWN_IP_ADDRESS) {
	        headers[HTTP_HEADER_FORWARDED_FOR] = geoRequestContext.ipAddress;
	      }
	      return fetchApi(geoLookupPath, {
	        headers
	      }).then(geoResponse => geoResponse.json().then(geoPayload => createGeoObjectFromPayload(geoPayload))).then(fetchedGeoValues => {
	        reactorObjectAssign(validatedGeoRequestContext, fetchedGeoValues);
	        eventEmitter(GEO_LOCATION_UPDATED, {
	          geoContext: validatedGeoRequestContext
	        });
	        return validatedGeoRequestContext;
	      });
	    }
	    return Promise.resolve(validatedGeoRequestContext);
	  }
	  return validGeoRequestContext;
	}

	const HEADER_BOUNDARY = 40;
	function ObfuscationProvider(config) {
	  const {
	    organizationId
	  } = config;
	  const decoder = new TextDecoder("utf-8");
	  function getHeader(buffer) {
	    const dataView = new DataView(buffer);
	    const text = decoder.decode(dataView);
	    const [prefix, version] = text.slice(0, 8).split(":");
	    const key = text.slice(8, 41);
	    return {
	      prefix,
	      version: parseInt(version, 10),
	      key
	    };
	  }
	  function getArtifact(key, obfuscatedArtifactBuffer) {
	    let deobfuscatedArtifactJSON = {};
	    const keyBuffer = new TextEncoder().encode([organizationId, key].join(""));
	    const keyView = new DataView(keyBuffer.buffer);
	    const keyLength = keyView.byteLength;
	    const obfuscatedArtifactView = new DataView(obfuscatedArtifactBuffer);
	    const artifactLength = obfuscatedArtifactView.byteLength;
	    const deobfuscatedArtifactView = new DataView(new ArrayBuffer(artifactLength));
	    for (let i = 0; i < artifactLength; i += 1) {
	      deobfuscatedArtifactView.setInt8(i, obfuscatedArtifactView.getInt8(i) ^ keyView.getInt8(i % keyLength));
	    }
	    const deobfuscatedArtifactString = decoder.decode(deobfuscatedArtifactView);
	    try {
	      deobfuscatedArtifactJSON = JSON.parse(deobfuscatedArtifactString);
	    } catch (err) {
	      throw new Error(Messages.ARTIFACT_OBFUSCATION_ERROR);
	    }
	    return deobfuscatedArtifactJSON;
	  }
	  function deobfuscate(buffer) {
	    const header = getHeader(buffer.slice(0, HEADER_BOUNDARY));
	    if (header.version !== SUPPORTED_ARTIFACT_OBFUSCATION_VERSION) {
	      throw new Error(Messages.ARTIFACT_INVALID);
	    }
	    return getArtifact(header.key, buffer.slice(HEADER_BOUNDARY));
	  }
	  return {
	    deobfuscate
	  };
	}

	const LOG_TAG$2 = LOG_PREFIX$1 + ".ArtifactProvider";
	const NOT_MODIFIED$1 = 304;
	const OK$1 = 200;
	function ArtifactProvider(config) {
	  const logger = getLogger(config.logger);
	  const {
	    eventEmitter = noop
	  } = config;
	  const obfuscationProvider = ObfuscationProvider(config);
	  function getPollingInterval() {
	    if (
	    isNumber(config.pollingInterval) && config.pollingInterval === 0) {
	      return 0;
	    }
	    return Math.max(MINIMUM_POLLING_INTERVAL, isNumber(config.pollingInterval) ? config.pollingInterval : DEFAULT_POLLING_INTERVAL);
	  }
	  const pollingInterval = getPollingInterval();
	  const fetchApi = getFetchApi(config.fetchApi);
	  let pollingHalted = false;
	  let pollingTimer;
	  let artifact;
	  const subscriptions = {};
	  let subscriptionCount = 0;
	  let lastResponseEtag;
	  let lastResponseData;
	  const artifactLocation = determineArtifactLocation(config);
	  const artifactFormat = isString(config.artifactFormat) ? config.artifactFormat : determineArtifactFormat(artifactLocation);
	  const fetchWithRetry = getFetchWithRetry(fetchApi, NUM_FETCH_RETRIES, errorMessage => Messages.ERROR_MAX_RETRY(NUM_FETCH_RETRIES, errorMessage), error => eventEmitter(ARTIFACT_DOWNLOAD_FAILED, {
	    artifactLocation,
	    error
	  }));
	  function emitNewArtifact(artifactPayload, geoContext = {}) {
	    eventEmitter(ARTIFACT_DOWNLOAD_SUCCEEDED, {
	      artifactLocation,
	      artifactPayload
	    });
	    eventEmitter(GEO_LOCATION_UPDATED, {
	      geoContext
	    });
	    values(subscriptions).forEach(subscriptionFunc => subscriptionFunc(artifactPayload));
	  }
	  function deobfuscate(res) {
	    if (artifactFormat === ARTIFACT_FORMAT_BINARY) {
	      perfTool.timeStart(TIMING_ARTIFACT_DEOBFUSCATE);
	      return res.arrayBuffer().then(buffer => {
	        return obfuscationProvider.deobfuscate(buffer).then(deobfuscated => {
	          perfTool.timeEnd(TIMING_ARTIFACT_DEOBFUSCATE);
	          return deobfuscated;
	        });
	      });
	    }
	    perfTool.timeStart(TIMING_ARTIFACT_READ_JSON);
	    return res.json().then(data => {
	      perfTool.timeEnd(TIMING_ARTIFACT_READ_JSON);
	      return data;
	    });
	  }
	  function fetchArtifact(artifactUrl) {
	    perfTool.timeStart(TIMING_ARTIFACT_DOWNLOADED_TOTAL);
	    const headers = {};
	    logger.debug(LOG_TAG$2 + " fetching artifact - " + artifactUrl);
	    if (lastResponseEtag && !isBrowser() && isNodeJS()) {
	      headers["If-None-Match"] = lastResponseEtag;
	    }
	    perfTool.timeStart(TIMING_ARTIFACT_DOWNLOADED_FETCH);
	    return fetchWithRetry(artifactUrl, {
	      headers,
	      cache: "default"
	    }).then(res => {
	      perfTool.timeEnd(TIMING_ARTIFACT_DOWNLOADED_FETCH);
	      logger.debug(LOG_TAG$2 + " artifact received - status=" + res.status);
	      if (res.status === NOT_MODIFIED$1 && lastResponseData) {
	        return lastResponseData;
	      }
	      if (res.ok && res.status === OK$1) {
	        return deobfuscate(res).then(responseData => {
	          const etag = res.headers.get("Etag");
	          if (etag != null && isDefined(etag)) {
	            lastResponseData = responseData;
	            lastResponseEtag = etag;
	          }
	          emitNewArtifact(responseData, createGeoObjectFromHeaders(res.headers));
	          perfTool.timeEnd(TIMING_ARTIFACT_DOWNLOADED_TOTAL);
	          return responseData;
	        });
	      }
	      return undefined;
	    })['catch'](err => {
	      const reason = err.message || err.toString();
	      logger.error(Messages.ARTIFACT_FETCH_ERROR(reason));
	    });
	  }
	  function addSubscription(callbackFunc) {
	    subscriptionCount += 1;
	    subscriptions[subscriptionCount] = callbackFunc;
	    return subscriptionCount;
	  }
	  function removeSubscription(id) {
	    delete subscriptions[id];
	  }
	  function scheduleNextUpdate() {
	    if (pollingInterval === 0 || pollingHalted) {
	      return;
	    }
	    pollingTimer = setTimeout(() => {
	      fetchArtifact(artifactLocation).then(newArtifact => {
	        artifact = newArtifact;
	        return newArtifact;
	      });
	      scheduleNextUpdate();
	    }, pollingInterval);
	  }
	  function stopAllPolling() {
	    if (isDefined(pollingTimer)) {
	      clearTimeout(pollingTimer);
	      pollingTimer = undefined;
	    }
	    pollingHalted = true;
	  }
	  function resumePolling() {
	    pollingHalted = false;
	    scheduleNextUpdate();
	  }
	  function getArtifact() {
	    return artifact;
	  }
	  function getInitialArtifact() {
	    perfTool.timeStart(TIMING_ARTIFACT_GET_INITIAL);
	    return isObject(config.artifactPayload) ? Promise.resolve(config.artifactPayload) : fetchArtifact(artifactLocation);
	  }
	  return getInitialArtifact().then(newArtifact => {
	    perfTool.timeEnd(TIMING_ARTIFACT_GET_INITIAL);
	    artifact = newArtifact;
	    const artifactTracer = ArtifactTracer(artifactLocation, config.artifactPayload, pollingInterval, pollingHalted, artifact);
	    addSubscription(value => artifactTracer.provideNewArtifact(value));
	    return {
	      getArtifact: () => getArtifact(),
	      subscribe: callbackFunc => addSubscription(callbackFunc),
	      unsubscribe: id => removeSubscription(id),
	      stopPolling: () => stopAllPolling(),
	      resumePolling: () => resumePolling(),
	      getTrace: () => artifactTracer.toJSON()
	    };
	  }).finally(() => {
	    scheduleNextUpdate();
	  });
	}

	function getCustomerId(visitorId) {
	  if (!visitorId.customerIds || !(visitorId.customerIds instanceof Array)) {
	    return undefined;
	  }
	  const customerIds = visitorId.customerIds.filter(customerId => customerId.authenticatedState === AuthenticatedState.Authenticated);
	  if (customerIds.length > 0) {
	    return customerIds[0].id;
	  }
	  return undefined;
	}
	function validVisitorId(visitorId, targetLocationHint) {
	  const result = _objectSpread2({}, visitorId);
	  if (!result.tntId && !result.marketingCloudVisitorId && !getCustomerId(result) && !result.thirdPartyId) {
	    const locationHint = isString(targetLocationHint) && !isBlank(targetLocationHint) ? "." + targetLocationHint + "_0" : "";
	    result.tntId = "" + uuid() + locationHint;
	  }
	  return result;
	}
	function validDeliveryRequest(request, targetLocationHint, validGeoRequestContext) {
	  const {
	    context = {}
	  } = request;
	  return validGeoRequestContext(context.geo || {}).then(geo => {
	    return _objectSpread2(_objectSpread2({}, request), {}, {
	      context: _objectSpread2(_objectSpread2({}, context), {}, {
	        geo
	      }),
	      id: validVisitorId(request.id, targetLocationHint),
	      requestId: request.requestId || uuid()
	    });
	  });
	}

	function TargetDecisioningEngine(config) {
	  const logger = getLogger(config.logger);
	  let artifactProvider;
	  let artifact;
	  function getOffers(targetOptions) {
	    let {
	      request
	    } = targetOptions;
	    if (isUndefined(artifact)) {
	      return Promise.reject(new Error(Messages.ARTIFACT_NOT_AVAILABLE));
	    }
	    if (!matchMajorVersion(artifact.version, SUPPORTED_ARTIFACT_MAJOR_VERSION)) {
	      return Promise.reject(new Error(Messages.ARTIFACT_VERSION_UNSUPPORTED(artifact.version, SUPPORTED_ARTIFACT_MAJOR_VERSION)));
	    }
	    return validDeliveryRequest(request, targetOptions.targetLocationHint, GeoProvider(config, artifact)).then(validRequest => {
	      request = validRequest;
	      const options = _objectSpread2(_objectSpread2({}, targetOptions), {}, {
	        request
	      });
	      const traceProvider = TraceProvider(config, options, artifactProvider.getTrace());
	      return DecisionProvider(config, options, createDecisioningContext(request), artifact, logger, traceProvider);
	    });
	  }
	  function isReady() {
	    return isDefined(artifact);
	  }
	  return ArtifactProvider(_objectSpread2(_objectSpread2({}, config), {}, {
	    logger
	  })).then(providerInstance => {
	    artifactProvider = providerInstance;
	    artifact = artifactProvider.getArtifact();
	    if (isUndefined(artifact)) {
	      throw new Error(Messages.ARTIFACT_NOT_AVAILABLE);
	    }
	    artifactProvider.subscribe(data => {
	      artifact = data;
	    });
	    return {
	      getRawArtifact: () => artifact,
	      stopPolling: () => artifactProvider.stopPolling(),
	      getOffers: targetOptions => getOffers(targetOptions),
	      hasRemoteDependency: request => hasRemoteDependency(artifact, request),
	      isReady
	    };
	  });
	}

	function lowerCaseHeaders(headers) {
	  const headerKeys = [];
	  const headerEntries = [];
	  const headersObj = {};
	  Object.keys(headers).forEach(key => {
	    const headerKey = key.toLowerCase();
	    const headerValue = headers[key];
	    headerKeys.push(headerKey);
	    headersObj[headerKey] = headerValue;
	    headerEntries.push([headerKey, headerValue]);
	  });
	  return {
	    headerKeys,
	    headerEntries,
	    headersObj
	  };
	}
	function unfetchResponse(responseURL, headers, body, requestStatus = 200, statusText = "") {
	  const encoder = new TextEncoder();
	  const decoder = new TextDecoder("utf-8");
	  let bodyArrayBuffer;
	  let bodyString;
	  if (isString(body)) {
	    bodyString = body;
	    bodyArrayBuffer = encoder.encode(body).buffer;
	  } else if (body instanceof ArrayBuffer) {
	    bodyString = decoder.decode(new DataView(body));
	    bodyArrayBuffer = body;
	  }
	  const {
	    headerKeys,
	    headerEntries,
	    headersObj
	  } = lowerCaseHeaders(headers);
	  const response = () => ({
	    ok: (requestStatus / 100 | 0) === 2,
	    statusText,
	    status: requestStatus,
	    url: responseURL,
	    text: () => reactorPromise.resolve(bodyString),
	    json: () => reactorPromise.resolve(JSON.parse(bodyString)),
	    blob: () => reactorPromise.resolve(new Blob([bodyArrayBuffer])),
	    arrayBuffer: () => reactorPromise.resolve(bodyArrayBuffer),
	    clone: response,
	    headers: {
	      keys: () => headerKeys,
	      entries: () => headerEntries,
	      get: n => headersObj[n.toLowerCase()],
	      has: n => n.toLowerCase() in headersObj
	    }
	  });
	  return response();
	}

	const hasNativeFetch = typeof window !== "undefined" && typeof window.fetch === "function";
	function getFetchResponseFactory() {
	  return hasNativeFetch ? (url, headers, body) => new Response(new Blob([body], {
	    headers
	  })) : unfetchResponse;
	}

	const TARGET_STORAGE_PREFIX = "tgt";
	const REGEX_TARGET_LOCAL_STORAGE_KEY = new RegExp("^" + TARGET_STORAGE_PREFIX + ":.+", "i");
	const REGEX_RULES_ARTIFACT = /rules\.(json|txt)$/i;
	const REGEX_CONTENT_TYPE_JSON = /(application\/json)|(text\/)/i;
	const createFetchResponse = getFetchResponseFactory();
	const isTargetLocalStorageKey = key => REGEX_TARGET_LOCAL_STORAGE_KEY.test(key);
	const isArtifactFile = url => url.match(REGEX_RULES_ARTIFACT);
	const isJsonContentType = contentType => contentType && contentType.match(REGEX_CONTENT_TYPE_JSON);
	const ARTIFACT_FETCH_DELAY = 1000;
	function localStorageAvailable() {
	  try {
	    const storage = window["localStorage"];
	    const x = "__storage_test__";
	    storage.setItem(x, x);
	    storage.removeItem(x);
	    return true;
	  } catch (e) {
	    return false;
	  }
	}
	const canCacheArtifact = localStorageAvailable();
	function getHeadersCacheKey(url) {
	  return TARGET_STORAGE_PREFIX + ":" + hashUnencodedChars(url) + ":h";
	}
	function getBodyCacheKey(url) {
	  return TARGET_STORAGE_PREFIX + ":" + hashUnencodedChars(url) + ":b";
	}
	function headersAsPOJO(headers) {
	  const result = {};
	  for (const [key, value] of headers.entries()) {
	    result[key] = value;
	  }
	  return result;
	}
	function clearTargetLocalStorage() {
	  Object.keys(localStorage).filter(isTargetLocalStorageKey).forEach(key => localStorage.removeItem(key));
	}
	function storeJsonInLocalStorage(key, jsonValue) {
	  try {
	    localStorage.setItem(key, JSON.stringify(jsonValue));
	  } catch (err) {
	    clearTargetLocalStorage();
	  }
	}
	function getArtifactFromCache(url) {
	  if (!canCacheArtifact) {
	    return undefined;
	  }
	  const cached = {
	    headers: localStorage.getItem(getHeadersCacheKey(url)),
	    body: localStorage.getItem(getBodyCacheKey(url))
	  };
	  if (cached.headers != null && cached.body != null) {
	    return cached;
	  }
	  return undefined;
	}
	function storeArtifactInCache(url, response) {
	  if (!canCacheArtifact) {
	    return resolve$1();
	  }
	  const headers = headersAsPOJO(response.headers);
	  storeJsonInLocalStorage(getHeadersCacheKey(url), headers);
	  return response.clone().json().then(content => {
	    storeJsonInLocalStorage(getBodyCacheKey(url), content);
	  });
	}
	function getFetchWithCaching(fetchApi) {
	  return function cachedFetch(url, options) {
	    if (!isArtifactFile(url)) {
	      return fetchApi(url, options);
	    }
	    const cachedArtifact = getArtifactFromCache(url);
	    function fetchAndCache(additionalOptions = {}) {
	      return fetchApi(url, _objectSpread2(_objectSpread2({}, options), additionalOptions)).then(response => {
	        if (isJsonContentType(response.headers.get("Content-Type"))) {
	          storeArtifactInCache(url, response);
	        }
	        return response;
	      });
	    }
	    if (isDefined(cachedArtifact)) {
	      $(() => {
	        setTimeout(() => fetchAndCache(), ARTIFACT_FETCH_DELAY);
	      });
	      return resolve$1(createFetchResponse(url, JSON.parse(cachedArtifact.headers), cachedArtifact.body));
	    }
	    return fetchAndCache();
	  };
	}
	function ensureArtifactCached(decisioningConfig) {
	  if (!canCacheArtifact) {
	    return decisioningConfig;
	  }
	  const cachedArtifact = getArtifactFromCache(determineArtifactLocation(decisioningConfig));
	  if (isDefined(cachedArtifact) || isDefined(decisioningConfig.artifactPayload)) {
	    return decisioningConfig;
	  }
	  $(() => {
	    setTimeout(() => ArtifactProvider(decisioningConfig), ARTIFACT_FETCH_DELAY);
	  });
	  throw new Error(NO_CACHED_ARTIFACT);
	}

	const DEFAULT_POLLING_INTERVAL$1 = 0;
	const eventbus = new tinyEmitter();
	let decisioningEnginePromise;
	function getDecisioningMethod(config, options = {}) {
	  return options[DECISIONING_METHOD_SETTING] || config[DECISIONING_METHOD_SETTING];
	}
	function isServerSideDecisioningMethod(config, options = {}) {
	  return getDecisioningMethod(config, options) === DECISIONING_METHOD.SERVER_SIDE;
	}
	function isHybridDecisioningMethod(config, options = {}) {
	  return getDecisioningMethod(config, options) === DECISIONING_METHOD.HYBRID;
	}
	function getPollingInterval(config) {
	  return isNumber(config[POLLING_INTERVAL_SETTING]) ? config[POLLING_INTERVAL_SETTING] : DEFAULT_POLLING_INTERVAL$1;
	}
	function getArtifactLocation(config) {
	  return config[ARTIFACT_LOCATION_SETTING];
	}
	function getArtifactFormat(config) {
	  return config[ARTIFACT_FORMAT_SETTING];
	}
	function getArtifactPayload(config) {
	  return config[ARTIFACT_PAYLOAD_SETTING];
	}
	function getTargetEnvironment$1(config) {
	  return config[TARGET_ENVIRONMENT_SETTING];
	}
	function getCdnEnvironment$1(config) {
	  return config[CDN_ENVIRONMENT_SETTING];
	}
	function getTelemetryEnabled(config) {
	  return config[TELEMETRY_ENABLED_SETTING];
	}
	function getCdnBasePath$1(config) {
	  return config[CDN_BASEPATH_SETTING];
	}
	function decisioningEngineRequired(config, options = {}) {
	  if (isAuthoringEnabled() || isQaMode() || isPreviewMode()) {
	    return false;
	  }
	  return requiresDecisioningEngine(getDecisioningMethod(reactorObjectAssign({}, config), options));
	}
	function ifOnDeviceDecisioningPossible(config) {
	  return !isServerSideDecisioningMethod(config) ? resolve$1() : reject$1(new Error(DECISIONING_ENGINE_NOT_READY));
	}
	function eventEmitter(eventName, payload) {
	  const config = getConfig();
	  notifyOnDeviceDecisioning(eventName, payload);
	  eventbus.emit(eventName, payload);
	  if (eventName !== GEO_LOCATION_UPDATED) {
	    return;
	  }
	  const {
	    geoContext
	  } = payload;
	  if (isDefined(geoContext) && !isEmpty(Object.keys(geoContext))) {
	    const geoCookieLifetime = 7 * 24 * 60 * 60 * 1000;
	    const expires = new Date(now() + geoCookieLifetime);
	    const domain = config[COOKIE_DOMAIN];
	    const secure = config[SECURE_ONLY];
	    const attrs = reactorObjectAssign({
	      expires,
	      domain,
	      secure
	    }, secure ? {
	      sameSite: SAMESITE_NONE
	    } : {});
	    setCookie(GEO_COOKIE, JSON.stringify(geoContext), attrs);
	  }
	}
	function getGeoContext(request) {
	  const geoCookie = getCookie(GEO_COOKIE);
	  const geoContext = reactorObjectAssign({}, isDefined(geoCookie) ? JSON.parse(geoCookie) : {}, request.context.geo);
	  if (isObject(geoContext) && isEmpty(Object.keys(geoContext))) {
	    return {
	      ipAddress: UNKNOWN_IP_ADDRESS
	    };
	  }
	  return geoContext;
	}
	function prepareDecisioningConfig(config, sendNotificationFn, customFetch) {
	  const targetPageParams = getTargetPageParams(config[GLOBAL_MBOX_NAME]);
	  const propertyToken = getPropertyToken$1(targetPageParams);
	  const CONF = {
	    client: config[CLIENT_CODE],
	    organizationId: config[IMS_ORG_ID],
	    pollingInterval: getPollingInterval(config),
	    propertyToken,
	    environment: getTargetEnvironment$1(config),
	    cdnEnvironment: getCdnEnvironment$1(config),
	    cdnBasePath: getCdnBasePath$1(config),
	    telemetryEnabled: getTelemetryEnabled(config),
	    eventEmitter,
	    logger,
	    fetchApi: getFetchWithCaching(isFunction(customFetch) ? customFetch : getFetchApi(isFunction(window.fetch) ? window.fetch : noopPromise)),
	    sendNotificationFunc: options => {
	      logDebug("sendNotificationFunc", options);
	      const {
	        request
	      } = options;
	      if (isFunction(sendNotificationFn)) {
	        sendNotificationFn(request);
	      }
	    }
	  };
	  const artifactPayload = getArtifactPayload(config);
	  return resolve$1(isDefined(artifactPayload) ? _objectSpread2(_objectSpread2({}, CONF), {}, {
	    artifactPayload
	  }) : _objectSpread2(_objectSpread2({}, CONF), {}, {
	    artifactFormat: getArtifactFormat(config),
	    artifactLocation: getArtifactLocation(config)
	  }));
	}
	function abortIfHybridAndArtifactNotCached(config, decisioningConfig) {
	  return isHybridDecisioningMethod(config) ? ensureArtifactCached(decisioningConfig) : decisioningConfig;
	}
	function bootstrapDecisioningEngine(config, sendNotificationFn, customFetch = undefined) {
	  if (!decisioningEngineRequired(config)) {
	    return;
	  }
	  decisioningEnginePromise = undefined;
	  decisioningEnginePromise = prepareDecisioningConfig(config, sendNotificationFn, customFetch).then(decisioningConfig => abortIfHybridAndArtifactNotCached(config, decisioningConfig)).then(decisioningConfig => TargetDecisioningEngine(decisioningConfig)).then(instance => {
	    return instance;
	  })['catch'](err => {
	    if (isErrorWithMessage(err, NO_CACHED_ARTIFACT)) {
	      eventbus.once(ARTIFACT_DOWNLOAD_SUCCEEDED, payload => bootstrapDecisioningEngine(_objectSpread2(_objectSpread2({}, config), {}, {
	        artifactPayload: payload.artifactPayload
	      }), sendNotificationFn, customFetch));
	    }
	    logDebug(err.message);
	    throw err;
	  });
	}
	function whenDecisioningEngineIsReady() {
	  return isDefined(decisioningEnginePromise) ? decisioningEnginePromise : reject$1();
	}
	function executeDecisioningRequest(request) {
	  const {
	    context = {}
	  } = request;
	  return whenDecisioningEngineIsReady().then(decisioningEngine => {
	    return decisioningEngine.getOffers({
	      request: _objectSpread2(_objectSpread2({}, request), {}, {
	        context: _objectSpread2(_objectSpread2({}, context), {}, {
	          geo: getGeoContext(request)
	        })
	      }),
	      targetLocationHint: getEdgeCluster()
	    }).then(response => {
	      return reactorObjectAssign(response, {
	        decisioningMethod: DECISIONING_METHOD.ON_DEVICE
	      });
	    });
	  });
	}
	function hasRemoteDependency$1(request) {
	  return whenDecisioningEngineIsReady().then(decisioningEngine => decisioningEngine.hasRemoteDependency(request));
	}

	const INIT = "[page-init]";
	function handleError$1(error) {
	  logWarn(INIT, VIEW_DELIVERY_ERROR, error);
	  publish(NO_OFFERS_EVENT);
	  addClientTrace({
	    source: INIT,
	    error
	  });
	  removeHidingSnippetStyle();
	}
	function handleSuccess(response, skipPrehiding = false) {
	  const options = {
	    selector: HEAD_TAG,
	    response
	  };
	  logDebug(INIT, RESPONSE, response);
	  addClientTrace({
	    source: INIT,
	    response
	  });
	  executeApplyOffers(options, skipPrehiding)['catch'](handleError$1);
	}
	function scrubServerStateResponse(config, response) {
	  const result = reactorObjectAssign({}, response);
	  const {
	    execute,
	    prefetch
	  } = result;
	  const pageLoadEnabled = config[PAGE_LOAD_ENABLED];
	  const viewsEnabled = config[VIEWS_ENABLED];
	  if (execute) {
	    result.execute.mboxes = undefined;
	  }
	  if (execute && !pageLoadEnabled) {
	    result.execute.pageLoad = undefined;
	  }
	  if (prefetch) {
	    result.prefetch.mboxes = undefined;
	  }
	  if (prefetch && !viewsEnabled) {
	    result.prefetch.views = undefined;
	  }
	  return result;
	}
	function processServerState(config) {
	  const serverState = getServerState(config);
	  const {
	    request,
	    response
	  } = serverState;
	  const skipPrehiding = true;
	  logDebug(INIT, USING_SERVER_STATE);
	  addClientTrace({
	    source: INIT,
	    serverState
	  });
	  const scrubbedResponse = scrubServerStateResponse(config, response);
	  hidePageLoadOptions(scrubbedResponse);
	  hideAllViews(scrubbedResponse);
	  processResponse({
	    request,
	    response: scrubbedResponse
	  }).then(res => handleSuccess(res, skipPrehiding))['catch'](handleError$1);
	}
	function initDecisioningEngine() {
	  const config = getConfig();
	  bootstrapDecisioningEngine(config, executeBeaconNotification);
	}
	function initDelivery() {
	  if (!isDeliveryEnabled() && !isAuthoringEnabled()) {
	    logWarn(INIT, DELIVERY_DISABLED);
	    addClientTrace({
	      source: INIT,
	      error: DELIVERY_DISABLED
	    });
	    return;
	  }
	  const config = getConfig();
	  if (hasServerState(config)) {
	    processServerState(config);
	    return;
	  }
	  const pageLoadEnabled = config[PAGE_LOAD_ENABLED];
	  const viewsEnabled = config[VIEWS_ENABLED];
	  if (!pageLoadEnabled && !viewsEnabled) {
	    logDebug(INIT, PAGE_LOAD_DISABLED);
	    addClientTrace({
	      source: INIT,
	      error: PAGE_LOAD_DISABLED
	    });
	    return;
	  }
	  injectHidingSnippetStyle();
	  const request = {};
	  if (pageLoadEnabled) {
	    const execute = {};
	    execute.pageLoad = {};
	    request.execute = execute;
	  }
	  if (viewsEnabled) {
	    const prefetch = {};
	    prefetch.views = [{}];
	    request.prefetch = prefetch;
	  }
	  const timeout = config[TIMEOUT];
	  logDebug(INIT, REQUEST, request);
	  addClientTrace({
	    source: INIT,
	    request
	  });
	  const options = {
	    request,
	    timeout
	  };
	  if (!shouldUseOptin() || isTargetApproved()) {
	    executeGetOffers(options).then(handleSuccess)['catch'](handleError$1);
	    return;
	  }
	  fetchOptinPermissions().then(() => {
	    executeGetOffers(options).then(handleSuccess)['catch'](handleError$1);
	  })['catch'](handleError$1);
	}

	function createValid() {
	  const result = {};
	  result[VALID] = true;
	  return result;
	}
	function createInvalid(error) {
	  const result = {};
	  result[VALID] = false;
	  result[ERROR] = error;
	  return result;
	}
	function validateMbox(mbox) {
	  if (isBlank(mbox)) {
	    return createInvalid(MBOX_REQUIRED);
	  }
	  if (mbox.length > MBOX_LENGTH) {
	    return createInvalid(MBOX_TOO_LONG);
	  }
	  return createValid();
	}
	function validateGetOfferOptions(options) {
	  if (!isObject(options)) {
	    return createInvalid(OPTIONS_REQUIRED);
	  }
	  const mbox = options[MBOX];
	  const mboxValidation = validateMbox(mbox);
	  if (!mboxValidation[VALID]) {
	    return mboxValidation;
	  }
	  if (!isFunction(options[SUCCESS])) {
	    return createInvalid(SUCCESS_REQUIRED);
	  }
	  if (!isFunction(options[ERROR])) {
	    return createInvalid(ERROR_REQUIRED);
	  }
	  return createValid();
	}
	function validateGetOffersOptions(options) {
	  if (!isObject(options)) {
	    return createInvalid(OPTIONS_REQUIRED);
	  }
	  const {
	    request
	  } = options;
	  if (!isObject(request)) {
	    return createInvalid(REQUEST_REQUIRED);
	  }
	  const {
	    execute,
	    prefetch
	  } = request;
	  if (!isObject(execute) && !isObject(prefetch)) {
	    return createInvalid(EXECUTE_OR_PREFETCH_REQUIRED);
	  }
	  return createValid();
	}
	function validateSendNotificationsOptions(options) {
	  if (!isObject(options)) {
	    return createInvalid(OPTIONS_REQUIRED);
	  }
	  const {
	    request
	  } = options;
	  if (!isObject(request)) {
	    return createInvalid(REQUEST_REQUIRED);
	  }
	  const {
	    execute,
	    prefetch,
	    notifications
	  } = request;
	  if (isObject(execute) || isObject(prefetch)) {
	    return createInvalid(EXECUTE_OR_PREFETCH_NOT_ALLOWED);
	  }
	  if (!isArray(notifications)) {
	    return createInvalid(NOTIFICATIONS_REQUIRED);
	  }
	  return createValid();
	}
	function validateApplyOfferOptions(options) {
	  if (!isObject(options)) {
	    return createInvalid(OPTIONS_REQUIRED);
	  }
	  const mbox = options[MBOX];
	  const mboxValidation = validateMbox(mbox);
	  if (!mboxValidation[VALID]) {
	    return mboxValidation;
	  }
	  const offer = options[OFFER];
	  if (!isArray(offer)) {
	    return createInvalid(OFFER_REQUIRED);
	  }
	  return createValid();
	}
	function validateApplyOffersOptions(options) {
	  if (!isObject(options)) {
	    return createInvalid(OPTIONS_REQUIRED);
	  }
	  const {
	    response
	  } = options;
	  if (!isObject(response)) {
	    return createInvalid(RESPONE_REQUIRED);
	  }
	  return createValid();
	}
	function validateTrackEventOptions(options) {
	  if (!isObject(options)) {
	    return createInvalid(OPTIONS_REQUIRED);
	  }
	  const mbox = options[MBOX];
	  const mboxValidation = validateMbox(mbox);
	  if (!mboxValidation[VALID]) {
	    return mboxValidation;
	  }
	  return createValid();
	}

	const EDGE_SERVER_PREFIX$1 = "mboxedge";
	const EDGE_SERVER_DOMAIN$1 = ".tt.omtrdc.net";
	const notEmpty$1 = val => !isEmpty(val);
	function throwIfOptout$1(values) {
	  const optout = values[MCOPTOUT];
	  if (optout) {
	    throw new Error(OPTOUT_MESSAGE);
	  }
	  return values;
	}
	function getAsyncThirdPartyData$1() {
	  const visitorValues = getAsyncVisitorValues();
	  const dataProvidersParams = getAsyncDataProvidersParameters();
	  return all([visitorValues.then(throwIfOptout$1), dataProvidersParams]);
	}
	function getAllParams$1(providersParams) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  return reactorObjectAssign({}, providersParams, getTargetPageParams(globalMbox));
	}
	function getTimeOffset$1() {
	  return -new Date().getTimezoneOffset();
	}
	function createScreen$1() {
	  const {
	    screen
	  } = window;
	  return {
	    width: screen.width,
	    height: screen.height,
	    orientation: getScreenOrientation(),
	    colorDepth: screen.colorDepth,
	    pixelRatio: getPixelRatio()
	  };
	}
	function createWindow$1() {
	  const {
	    documentElement
	  } = document;
	  return {
	    width: documentElement.clientWidth,
	    height: documentElement.clientHeight
	  };
	}
	function createBrowser$1() {
	  const {
	    location
	  } = window;
	  return {
	    host: location.hostname,
	    webGLRenderer: getWebGLRenderer()
	  };
	}
	function createAddress$1() {
	  const {
	    location
	  } = window;
	  return {
	    url: location.href,
	    referringUrl: document.referrer
	  };
	}
	function createContext$1(context) {
	  if (!isNil(context) && context.channel === WEB_CHANNEL) {
	    return context;
	  }
	  const validContext = context || {};
	  const {
	    beacon
	  } = validContext;
	  return {
	    userAgent: window.navigator.userAgent,
	    timeOffsetInMinutes: getTimeOffset$1(),
	    channel: WEB_CHANNEL,
	    screen: createScreen$1(),
	    window: createWindow$1(),
	    browser: createBrowser$1(),
	    address: createAddress$1(),
	    geo: context && context.geo,
	    beacon
	  };
	}
	function createAudienceManager$1(audienceManager, visitorValues) {
	  if (!isNil(audienceManager)) {
	    return audienceManager;
	  }
	  const result = {};
	  if (isEmpty(visitorValues)) {
	    return result;
	  }
	  const locationHint = visitorValues[MCAAMLH];
	  const locationHintNumber = parseInt(locationHint, 10);
	  if (!isNaN(locationHintNumber)) {
	    result.locationHint = locationHintNumber;
	  }
	  const blob = visitorValues[MCAAMB];
	  if (isNotBlank(blob)) {
	    result.blob = blob;
	  }
	  return result;
	}
	function createCustomerId$1(data) {
	  const {
	    id,
	    integrationCode,
	    authenticatedState,
	    type,
	    primary
	  } = data;
	  const result = {};
	  if (isNotBlank(id)) {
	    result.id = id;
	  }
	  if (isNotBlank(integrationCode)) {
	    result.integrationCode = integrationCode;
	  }
	  if (isNotBlank(authenticatedState)) {
	    result.authenticatedState = authenticatedState;
	  }
	  if (isNotBlank(type)) {
	    result.type = type;
	  }
	  if (primary) {
	    result.primary = primary;
	  }
	  return result;
	}
	function createCustomerIds$1(customerIdsValues) {
	  return map(createCustomerId$1, customerIdsValues);
	}
	function createVisitorId$1(id, deviceId, thirdPartyId, visitorValues, customerIdsValues) {
	  const result = {};
	  if (isNotBlank(deviceId)) {
	    result.tntId = deviceId;
	  }
	  if (isNotBlank(thirdPartyId)) {
	    result.thirdPartyId = thirdPartyId;
	  }
	  if (isNotBlank(id.thirdPartyId)) {
	    result.thirdPartyId = id.thirdPartyId;
	  }
	  const mid = visitorValues[MCMID];
	  if (isNotBlank(mid)) {
	    result.marketingCloudVisitorId = mid;
	  }
	  if (isNotBlank(id.marketingCloudVisitorId)) {
	    result.marketingCloudVisitorId = id.marketingCloudVisitorId;
	  }
	  if (!isEmpty(id.customerIds)) {
	    result.customerIds = id.customerIds;
	    return result;
	  }
	  if (!isEmpty(customerIdsValues)) {
	    result.customerIds = createCustomerIds$1(customerIdsValues);
	  }
	  return result;
	}
	function createExperienceCloud$1(experienceCloud, visitorValues) {
	  const result = {};
	  const audienceManager = createAudienceManager$1(experienceCloud.audienceManager, visitorValues);
	  if (!isEmpty(audienceManager)) {
	    result.audienceManager = audienceManager;
	  }
	  if (!isEmpty(experienceCloud.analytics)) {
	    result.analytics = experienceCloud.analytics;
	  }
	  return result;
	}
	function createProperty$1(property, allParams) {
	  if (!isNil(property) && isNotBlank(property.token)) {
	    return property;
	  }
	  const result = {};
	  const token = getPropertyToken$1(allParams);
	  if (isNotBlank(token)) {
	    result.token = token;
	  }
	  return result;
	}
	function createTrace$2(trace) {
	  if (!isNil(trace) && isNotBlank(trace.authorizationToken)) {
	    return trace;
	  }
	  const result = {};
	  const authorizationToken = getTraceToken();
	  if (isNotBlank(authorizationToken)) {
	    result.authorizationToken = authorizationToken;
	  }
	  return result;
	}
	function createPreview$1(preview) {
	  if (!isNil(preview)) {
	    return preview;
	  }
	  return getPreview();
	}
	function createQaMode$1(qaMode) {
	  if (!isNil(qaMode)) {
	    return qaMode;
	  }
	  return getQaMode();
	}
	function createOrder$1(params) {
	  const result = {};
	  const orderId = getOrderId(params);
	  if (!isNil(orderId)) {
	    result.id = orderId;
	  }
	  const orderTotal = getOrderTotal(params);
	  const orderTotalNumber = parseFloat(orderTotal);
	  if (!isNaN(orderTotalNumber)) {
	    result.total = orderTotalNumber;
	  }
	  const purchasedProductIds = getPurchasedProductIds(params);
	  if (!isEmpty(purchasedProductIds)) {
	    result.purchasedProductIds = purchasedProductIds;
	  }
	  return result;
	}
	function createProduct$1(params) {
	  const result = {};
	  const productId = getProductId(params);
	  if (!isNil(productId)) {
	    result.id = productId;
	  }
	  const categoryId = getCategoryId(params);
	  if (!isNil(categoryId)) {
	    result.categoryId = categoryId;
	  }
	  return result;
	}
	function createRequestDetails$1(item, allParams) {
	  const result = {};
	  const params = reactorObjectAssign({}, getParams$1(allParams), item.parameters || {});
	  const profileParams = reactorObjectAssign({}, getProfileParams(allParams), item.profileParameters || {});
	  const order = reactorObjectAssign({}, createOrder$1(allParams), item.order || {});
	  const product = reactorObjectAssign({}, createProduct$1(allParams), item.product || {});
	  if (!isEmpty(params)) {
	    result.parameters = params;
	  }
	  if (!isEmpty(profileParams)) {
	    result.profileParameters = profileParams;
	  }
	  if (!isEmpty(order)) {
	    result.order = order;
	  }
	  if (!isEmpty(product)) {
	    result.product = product;
	  }
	  return result;
	}
	function createMboxRequestDetails$1(item, allParams, providersParams = {}) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const {
	    index,
	    name,
	    address
	  } = item;
	  const params = reactorObjectAssign({}, name === globalMbox ? allParams : providersParams, getTargetPageParams(name));
	  const result = createRequestDetails$1(item, params);
	  if (!isNil(index)) {
	    result.index = index;
	  }
	  if (isNotBlank(name)) {
	    result.name = name;
	  }
	  if (!isEmpty(address)) {
	    result.address = address;
	  }
	  return result;
	}
	function createViewRequestDetails$1(item, allParams) {
	  const {
	    name,
	    address
	  } = item;
	  const result = createRequestDetails$1(item, allParams);
	  if (isNotBlank(name)) {
	    result.name = name;
	  }
	  if (!isEmpty(address)) {
	    result.address = address;
	  }
	  return result;
	}
	function createExecute$1(request, allParams, providersParams) {
	  const {
	    execute = {}
	  } = request;
	  const result = {};
	  if (isEmpty(execute)) {
	    return result;
	  }
	  const {
	    pageLoad
	  } = execute;
	  if (!isNil(pageLoad)) {
	    result.pageLoad = createRequestDetails$1(pageLoad, allParams);
	  }
	  const {
	    mboxes
	  } = execute;
	  if (!isNil(mboxes) && isArray(mboxes) && !isEmpty(mboxes)) {
	    const temp = filter(notEmpty$1, map(e => createMboxRequestDetails$1(e, allParams, providersParams), mboxes));
	    if (!isEmpty(temp)) {
	      result.mboxes = temp;
	    }
	  }
	  return result;
	}
	function createPrefetch$1(request, allParams, providersParams) {
	  const {
	    prefetch = {}
	  } = request;
	  const result = {};
	  if (isEmpty(prefetch)) {
	    return result;
	  }
	  const {
	    mboxes
	  } = prefetch;
	  if (!isNil(mboxes) && isArray(mboxes) && !isEmpty(mboxes)) {
	    result.mboxes = map(e => createMboxRequestDetails$1(e, allParams, providersParams), mboxes);
	  }
	  const {
	    views
	  } = prefetch;
	  if (!isNil(views) && isArray(views) && !isEmpty(views)) {
	    result.views = map(e => createViewRequestDetails$1(e, allParams), views);
	  }
	  return result;
	}
	function createAnalytics$1(consumerId, request) {
	  if (shouldUseOptin() && !isAnalyticsApproved()) {
	    return null;
	  }
	  const config = getConfig();
	  const sdid = getSdidVisitorValue(consumerId);
	  const server = getVisitorProperty(TRACK_SERVER_PROP);
	  const serverSecure = getVisitorProperty(TRACK_SERVER_SECURE_PROP);
	  const {
	    experienceCloud = {}
	  } = request;
	  const {
	    analytics = {}
	  } = experienceCloud;
	  const {
	    logging,
	    supplementalDataId,
	    trackingServer,
	    trackingServerSecure
	  } = analytics;
	  const result = {};
	  if (!isNil(logging)) {
	    result.logging = logging;
	  } else {
	    result.logging = config[ANALYTICS_LOGGING];
	  }
	  if (!isNil(supplementalDataId)) {
	    result.supplementalDataId = supplementalDataId;
	  }
	  if (isNotBlank(sdid)) {
	    result.supplementalDataId = sdid;
	  }
	  if (!isNil(trackingServer)) {
	    result.trackingServer = trackingServer;
	  }
	  if (isNotBlank(server)) {
	    result.trackingServer = server;
	  }
	  if (!isNil(trackingServerSecure)) {
	    result.trackingServerSecure = trackingServerSecure;
	  }
	  if (isNotBlank(serverSecure)) {
	    result.trackingServerSecure = serverSecure;
	  }
	  if (isEmpty(result)) {
	    return null;
	  }
	  return result;
	}
	function createDeliveryRequest$1(request, visitorValues, providersParams) {
	  const allParams = getAllParams$1(providersParams);
	  const deviceId = getDeviceId();
	  const thirdPartyId = getThirdPartyId(allParams);
	  const customerIdsValues = getCustomerIdsVisitorValues();
	  const visitorId = createVisitorId$1(request.id || {}, deviceId, thirdPartyId, visitorValues, customerIdsValues);
	  const property = createProperty$1(request.property, allParams);
	  const experienceCloud = createExperienceCloud$1(request.experienceCloud || {}, visitorValues);
	  const trace = createTrace$2(request.trace);
	  const preview = createPreview$1(request.preview);
	  const qaMode = createQaMode$1(request.qaMode);
	  const execute = createExecute$1(request, allParams, providersParams);
	  const prefetch = createPrefetch$1(request, allParams, providersParams);
	  const {
	    notifications
	  } = request;
	  const result = {};
	  result.requestId = uuid();
	  result.context = createContext$1(request.context);
	  if (!isEmpty(visitorId)) {
	    result.id = visitorId;
	  }
	  if (!isEmpty(property)) {
	    result.property = property;
	  }
	  if (!isEmpty(trace)) {
	    result.trace = trace;
	  }
	  if (!isEmpty(experienceCloud)) {
	    result.experienceCloud = experienceCloud;
	  }
	  if (!isEmpty(preview)) {
	    result.preview = preview;
	  }
	  if (!isEmpty(qaMode)) {
	    result.qaMode = qaMode;
	  }
	  if (!isEmpty(execute)) {
	    result.execute = execute;
	  }
	  if (!isEmpty(prefetch)) {
	    result.prefetch = prefetch;
	  }
	  if (!isEmpty(notifications)) {
	    result.notifications = notifications;
	  }
	  return result;
	}
	function buildRequest$1(request, params, data) {
	  const visitorValues = data[0];
	  const providersValues = data[1];
	  const providersParams = reactorObjectAssign({}, providersValues, params);
	  return createDeliveryRequest$1(request, visitorValues, providersParams);
	}
	function createAsyncDeliveryRequest$1(request, params) {
	  return getAsyncThirdPartyData$1().then(data => buildRequest$1(request, params, data));
	}
	function getTimeout$1(config, timeout) {
	  if (!isNumber(timeout)) {
	    return config[TIMEOUT];
	  }
	  if (timeout < 0) {
	    return config[TIMEOUT];
	  }
	  return timeout;
	}
	function getServerDomain$1(config) {
	  const serverDomain = config[SERVER_DOMAIN];
	  const overrideMboxEdgeServer = config[OVERRIDE_MBOX_EDGE_SERVER];
	  if (!overrideMboxEdgeServer) {
	    return serverDomain;
	  }
	  const cluster = getEdgeCluster();
	  if (isBlank(cluster)) {
	    return serverDomain;
	  }
	  return "" + EDGE_SERVER_PREFIX$1 + cluster + EDGE_SERVER_DOMAIN$1;
	}
	function createRequestUrl$1(config) {
	  const scheme = config[SCHEME];
	  const host = getServerDomain$1(config);
	  const path = config[ENDPOINT];
	  const client = config[CLIENT_CODE];
	  const sessionId = getSessionId();
	  const version = config[VERSION];
	  const queryString = stringifyQueryString({
	    client,
	    sessionId,
	    version
	  });
	  return scheme + "//" + host + path + "?" + queryString;
	}
	function executeDeliveryRequest$1(request, requestTimeout) {
	  const config = getConfig();
	  const url = createRequestUrl$1(config);
	  const headers = {
	    [CONTENT_TYPE]: [TEXT_PLAIN]
	  };
	  const timeout = getTimeout$1(config, requestTimeout);
	  const async = true;
	  const options = {
	    url,
	    headers,
	    body: request,
	    timeout,
	    async
	  };
	  return executeXhr(options).then(response => {
	    return reactorObjectAssign(response, {
	      decisioningMethod: DECISIONING_METHOD.SERVER_SIDE
	    });
	  });
	}
	function prepareExecuteRequest(config, options, request, requestTimeout) {
	  const decisioningMethod = getDecisioningMethod(config, options);
	  if (!decisioningEngineRequired(config, options)) {
	    return executeDeliveryRequest$1(request, requestTimeout);
	  }
	  return ifOnDeviceDecisioningPossible(config).then(() => hasRemoteDependency$1(request)).then(dependency => {
	    if (decisioningMethod === DECISIONING_METHOD.HYBRID && dependency.remoteNeeded) {
	      return executeDeliveryRequest$1(request, requestTimeout);
	    }
	    return executeDecisioningRequest(request);
	  })['catch'](err => {
	    if (decisioningMethod === DECISIONING_METHOD.HYBRID) {
	      return executeDeliveryRequest$1(request, requestTimeout);
	    }
	    throw err;
	  });
	}
	function executeRequest$1(options, request, requestTimeout) {
	  const config = getConfig();
	  logDebug(REQUEST, request);
	  addClientTrace({
	    request
	  });
	  return prepareExecuteRequest(config, options, request, requestTimeout).then(response => {
	    logDebug(RESPONSE, response);
	    addClientTrace({
	      response
	    });
	    return {
	      request,
	      response
	    };
	  });
	}

	function handleRequestSuccess$1(response) {
	  const payload = createEventPayload(response);
	  const analyticsDetails = getAnalyticsDetails(response);
	  if (!isEmpty(analyticsDetails)) {
	    payload.analyticsDetails = analyticsDetails;
	  }
	  logDebug(REQUEST_SUCCEEDED, response);
	  notifyRequestSucceeded(payload, hasRedirect(response));
	  return resolve$1(response);
	}
	function handleMboxRequestSuccess(mbox, response) {
	  const payload = createEventPayload(response);
	  payload.mbox = mbox;
	  logDebug(REQUEST_SUCCEEDED, response);
	  notifyRequestSucceeded(payload, hasRedirect(response));
	  return resolve$1(response);
	}
	function handleRequestError$1(error) {
	  logWarn(REQUEST_FAILED, error);
	  notifyRequestFailed({
	    error
	  });
	  return reject$1(error);
	}
	function handleMboxRequestError(mbox, error) {
	  logWarn(REQUEST_FAILED, error);
	  notifyRequestFailed({
	    mbox,
	    error
	  });
	  return reject$1(error);
	}
	function executeGetOffer(options) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const {
	    mbox,
	    timeout
	  } = options;
	  const params = isObject(options.params) ? options.params : {};
	  const successFunc = response => handleMboxRequestSuccess(mbox, response);
	  const errorFunc = error => handleMboxRequestError(mbox, error);
	  const payload = {};
	  const execute = {};
	  if (mbox === globalMbox) {
	    execute.pageLoad = {};
	  } else {
	    execute.mboxes = [{
	      index: 0,
	      name: mbox
	    }];
	  }
	  payload.execute = execute;
	  const analytics = createAnalytics$1(mbox, payload);
	  if (!isEmpty(analytics)) {
	    const experienceCloud = {};
	    experienceCloud.analytics = analytics;
	    payload.experienceCloud = experienceCloud;
	  }
	  notifyRequestStart({
	    mbox
	  });
	  return createAsyncDeliveryRequest$1(payload, params).then(request => executeRequest$1(options, request, timeout)).then(processResponse).then(successFunc)['catch'](errorFunc);
	}
	function executeGetOffers$1(options) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const {
	    consumerId = globalMbox,
	    request,
	    timeout
	  } = options;
	  const analytics = createAnalytics$1(consumerId, request);
	  const successFunc = response => handleRequestSuccess$1(response);
	  const errorFunc = error => handleRequestError$1(error);
	  if (!isEmpty(analytics)) {
	    const experienceCloud = request.experienceCloud || {};
	    experienceCloud.analytics = analytics;
	    request.experienceCloud = experienceCloud;
	  }
	  notifyRequestStart({});
	  function measurePerf(response) {
	    return resolve$1(response);
	  }
	  return createAsyncDeliveryRequest$1(request, {}).then(deliveryRequest => executeRequest$1(options, deliveryRequest, timeout)).then(processResponse).then(measurePerf).then(successFunc)['catch'](errorFunc);
	}

	function redirect$2(option) {
	  return {
	    action: REDIRECT,
	    url: option.content
	  };
	}
	function setHtml$3(action) {
	  const result = {};
	  result.action = SET_CONTENT;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function setText$4(action) {
	  const result = {};
	  result.action = SET_TEXT;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function appendHtml$2(action) {
	  const result = {};
	  result.action = APPEND_CONTENT;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function prependHtml$2(action) {
	  const result = {};
	  result.action = PREPEND_CONTENT;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function replaceHtml$2(action) {
	  const result = {};
	  result.action = REPLACE_CONTENT;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function insertBefore$3(action) {
	  const result = {};
	  result.action = INSERT_BEFORE;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function insertAfter$3(action) {
	  const result = {};
	  result.action = INSERT_AFTER;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function customCode$3(action) {
	  const result = {};
	  result.action = CUSTOM_CODE;
	  result.content = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function setAttribute$3(action) {
	  const attribute = keys(action.content)[0];
	  const result = {};
	  result.action = SET_ATTRIBUTE;
	  result.attribute = attribute;
	  result.value = action.content[attribute];
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function setImageSource$2(action) {
	  const result = {};
	  result.action = SET_ATTRIBUTE;
	  result.attribute = SRC;
	  result.value = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function setStyle$3(action) {
	  const result = {};
	  result.action = SET_STYLE;
	  result.style = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function resize$2(action) {
	  const result = {};
	  result.action = SET_STYLE;
	  result.style = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function move$2(action) {
	  const result = {};
	  result.action = SET_STYLE;
	  result.style = action.content;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function remove$4(action) {
	  const result = {};
	  result.action = REMOVE;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function rearrange$3(action) {
	  const result = {};
	  result.action = REARRANGE;
	  result.from = action.content.from;
	  result.to = action.content.to;
	  result.selector = action.selector;
	  result.cssSelector = action.cssSelector;
	  return result;
	}
	function processActions(actions) {
	  const result = [];
	  forEach(action => {
	    const {
	      type
	    } = action;
	    switch (type) {
	      case SET_HTML:
	        result.push(setHtml$3(action));
	        break;
	      case SET_TEXT:
	        result.push(setText$4(action));
	        break;
	      case APPEND_HTML:
	        result.push(appendHtml$2(action));
	        break;
	      case PREPEND_HTML:
	        result.push(prependHtml$2(action));
	        break;
	      case REPLACE_HTML:
	        result.push(replaceHtml$2(action));
	        break;
	      case INSERT_BEFORE:
	        result.push(insertBefore$3(action));
	        break;
	      case INSERT_AFTER:
	        result.push(insertAfter$3(action));
	        break;
	      case CUSTOM_CODE:
	        result.push(customCode$3(action));
	        break;
	      case SET_ATTRIBUTE:
	        result.push(setAttribute$3(action));
	        break;
	      case SET_IMAGE_SOURCE:
	        result.push(setImageSource$2(action));
	        break;
	      case SET_STYLE:
	        result.push(setStyle$3(action));
	        break;
	      case RESIZE:
	        result.push(resize$2(action));
	        break;
	      case MOVE:
	        result.push(move$2(action));
	        break;
	      case REMOVE:
	        result.push(remove$4(action));
	        break;
	      case REARRANGE:
	        result.push(rearrange$3(action));
	        break;
	      case REDIRECT:
	        result.push(redirect$2(action));
	        break;
	    }
	  }, actions);
	  return result;
	}
	function processMetrics$2(metrics) {
	  if (isEmpty(metrics)) {
	    return [];
	  }
	  const result = [];
	  forEach(m => {
	    if (m.type !== CLICK) {
	      return;
	    }
	    if (hasSelector(m)) {
	      result.push({
	        action: TRACK_CLICK,
	        selector: m.selector,
	        clickTrackId: m.eventToken
	      });
	    } else {
	      result.push({
	        action: SIGNAL_CLICK,
	        clickTrackId: m.eventToken
	      });
	    }
	  }, metrics);
	  return result;
	}
	function processItem(item) {
	  if (isEmpty(item)) {
	    return [];
	  }
	  const htmls = [];
	  const jsons = [];
	  const actions = [];
	  const {
	    options = [],
	    metrics = []
	  } = item;
	  forEach(option => {
	    const {
	      type
	    } = option;
	    switch (type) {
	      case HTML:
	        htmls.push(option.content);
	        break;
	      case JSON$1:
	        jsons.push(option.content);
	        break;
	      case REDIRECT:
	        actions.push(redirect$2(option));
	        break;
	      case ACTIONS:
	        actions.push.apply(actions, processActions(option.content));
	        break;
	    }
	  }, options);
	  if (!isEmpty(htmls)) {
	    actions.push({
	      action: SET_CONTENT,
	      content: htmls.join("")
	    });
	  }
	  if (!isEmpty(jsons)) {
	    actions.push({
	      action: SET_JSON,
	      content: jsons
	    });
	  }
	  const clickActions = processMetrics$2(metrics);
	  if (!isEmpty(clickActions)) {
	    actions.push.apply(actions, clickActions);
	  }
	  return actions;
	}
	function convertToActions(response) {
	  const {
	    execute = {}
	  } = response;
	  const {
	    pageLoad = {}
	  } = execute;
	  const {
	    mboxes = []
	  } = execute;
	  const result = [];
	  result.push.apply(result, processItem(pageLoad));
	  result.push.apply(result, flatten(map(processItem, mboxes)));
	  return result;
	}

	const GET_OFFER = "[getOffer()]";
	function handleRequestSuccess$2(options, response) {
	  const actions = convertToActions(response);
	  options[SUCCESS](actions);
	}
	function handleRequestError$2(options, error) {
	  const status = error[STATUS] || UNKNOWN;
	  options[ERROR](status, error);
	}
	function getOffer(options) {
	  const validationResult = validateGetOfferOptions(options);
	  const error = validationResult[ERROR];
	  if (!validationResult[VALID]) {
	    logWarn(GET_OFFER, error);
	    addClientTrace({
	      source: GET_OFFER,
	      options,
	      error
	    });
	    return;
	  }
	  if (!isDeliveryEnabled() && !isAuthoringEnabled()) {
	    delay(options[ERROR](WARNING, DELIVERY_DISABLED));
	    logWarn(GET_OFFER, DELIVERY_DISABLED);
	    addClientTrace({
	      source: GET_OFFER,
	      options,
	      error: DELIVERY_DISABLED
	    });
	    return;
	  }
	  const successFunc = response => handleRequestSuccess$2(options, response);
	  const errorFunc = err => handleRequestError$2(options, err);
	  logDebug(GET_OFFER, options);
	  addClientTrace({
	    source: GET_OFFER,
	    options
	  });
	  if (!shouldUseOptin() || isTargetApproved()) {
	    executeGetOffer(options).then(successFunc)['catch'](errorFunc);
	    return;
	  }
	  fetchOptinPermissions().then(() => {
	    executeGetOffer(options).then(successFunc)['catch'](errorFunc);
	  });
	}

	const GET_OFFERS = "[getOffers()]";
	function getOffers(options) {
	  const validationResult = validateGetOffersOptions(options);
	  const error = validationResult[ERROR];
	  if (!validationResult[VALID]) {
	    logWarn(GET_OFFERS, error);
	    addClientTrace({
	      source: GET_OFFERS,
	      options,
	      error
	    });
	    return reject$1(validationResult);
	  }
	  if (!isDeliveryEnabled() && !isAuthoringEnabled()) {
	    logWarn(GET_OFFERS, DELIVERY_DISABLED);
	    addClientTrace({
	      source: GET_OFFERS,
	      options,
	      error: DELIVERY_DISABLED
	    });
	    return reject$1(new Error(DELIVERY_DISABLED));
	  }
	  logDebug(GET_OFFERS, options);
	  addClientTrace({
	    source: GET_OFFERS,
	    options
	  });
	  if (!shouldUseOptin() || isTargetApproved()) {
	    return executeGetOffers$1(options);
	  }
	  return fetchOptinPermissions().then(() => executeGetOffers$1(options));
	}

	const APPLY_OFFER = "[applyOffer()]";
	function applyOffer(options) {
	  const selector = retrieveSelector(options.selector);
	  const validationResult = validateApplyOfferOptions(options);
	  const error = validationResult[ERROR];
	  if (!validationResult[VALID]) {
	    logWarn(APPLY_OFFER, options, error);
	    addClientTrace({
	      source: APPLY_OFFER,
	      options,
	      error
	    });
	    showElement(selector);
	    return;
	  }
	  if (!isDeliveryEnabled() && !isAuthoringEnabled()) {
	    logWarn(APPLY_OFFER, DELIVERY_DISABLED);
	    addClientTrace({
	      source: APPLY_OFFER,
	      options,
	      error: DELIVERY_DISABLED
	    });
	    showElement(selector);
	    return;
	  }
	  options.selector = selector;
	  logDebug(APPLY_OFFER, options);
	  addClientTrace({
	    source: APPLY_OFFER,
	    options
	  });
	  executeApplyOffer(options);
	}

	const APPLY_OFFERS = "[applyOffers()]";
	function applyOffers(options) {
	  const selector = retrieveSelector(options.selector);
	  const validationResult = validateApplyOffersOptions(options);
	  const error = validationResult[ERROR];
	  if (!validationResult[VALID]) {
	    logWarn(APPLY_OFFERS, options, error);
	    addClientTrace({
	      source: APPLY_OFFERS,
	      options,
	      error
	    });
	    showElement(selector);
	    return reject$1(validationResult);
	  }
	  if (!isDeliveryEnabled() && !isAuthoringEnabled()) {
	    logWarn(APPLY_OFFERS, DELIVERY_DISABLED);
	    addClientTrace({
	      source: APPLY_OFFERS,
	      options,
	      error: DELIVERY_DISABLED
	    });
	    showElement(selector);
	    return reject$1(new Error(DELIVERY_DISABLED));
	  }
	  options.selector = selector;
	  logDebug(APPLY_OFFERS, options);
	  addClientTrace({
	    source: APPLY_OFFERS,
	    options
	  });
	  return executeApplyOffers(options);
	}

	const SEND_NOTIFICATIONS = "[sendNotifications()]";
	function sendNotifications(options) {
	  const config = getConfig();
	  const globalMbox = config[GLOBAL_MBOX_NAME];
	  const {
	    consumerId = globalMbox,
	    request
	  } = options;
	  const validationResult = validateSendNotificationsOptions(options);
	  const error = validationResult[ERROR];
	  if (!validationResult[VALID]) {
	    logWarn(SEND_NOTIFICATIONS, error);
	    addClientTrace({
	      source: SEND_NOTIFICATIONS,
	      options,
	      error
	    });
	    return;
	  }
	  if (!isDeliveryEnabled() && !isAuthoringEnabled()) {
	    logWarn(SEND_NOTIFICATIONS, DELIVERY_DISABLED);
	    addClientTrace({
	      source: SEND_NOTIFICATIONS,
	      options,
	      error: DELIVERY_DISABLED
	    });
	    return;
	  }
	  logDebug(SEND_NOTIFICATIONS, options);
	  addClientTrace({
	    source: SEND_NOTIFICATIONS,
	    options
	  });
	  const {
	    notifications
	  } = request;
	  const notificationsRequest = createSyncNotificationRequest(consumerId, {}, notifications);
	  if (shouldUseOptin() && !isTargetApproved()) {
	    logWarn(SEND_NOTIFICATIONS, ERROR_TARGET_NOT_OPTED_IN);
	    return;
	  }
	  executeBeaconNotification(notificationsRequest);
	}

	const TRACK_EVENT = "[trackEvent()]";
	function normalizeOptions(config, options) {
	  const mbox = options[MBOX];
	  const result = reactorObjectAssign({}, options);
	  const optsParams = isObject(options.params) ? options.params : {};
	  result[PARAMS] = reactorObjectAssign({}, getTargetPageParams(mbox), optsParams);
	  result[TIMEOUT] = getTimeout(config, options[TIMEOUT]);
	  result[SUCCESS] = isFunction(options[SUCCESS]) ? options[SUCCESS] : noop;
	  result[ERROR] = isFunction(options[ERROR]) ? options[ERROR] : noop;
	  return result;
	}
	function shouldTrackBySelector(options) {
	  const type = options[TYPE];
	  const selector = options[SELECTOR];
	  return isNotBlank(type) && (isNotBlank(selector) || isElement(selector));
	}
	function trackImmediateInternal(options) {
	  const {
	    mbox,
	    type = DISPLAY_EVENT
	  } = options;
	  const optsParams = isObject(options.params) ? options.params : {};
	  const params = reactorObjectAssign({}, getTargetPageParams(mbox), optsParams);
	  const requestDetails = createRequestDetails({}, params);
	  const notification = createNotification(requestDetails, type, []);
	  notification.mbox = {
	    name: mbox
	  };
	  const request = createSyncNotificationRequest(mbox, params, [notification]);
	  if (executeBeaconNotification(request)) {
	    logDebug(TRACK_EVENT_SUCCESS, options);
	    options[SUCCESS]();
	    return;
	  }
	  logWarn(TRACK_EVENT_ERROR, options);
	  options[ERROR](UNKNOWN, TRACK_EVENT_ERROR);
	}
	function trackImmediate(options) {
	  if (shouldUseOptin() && !isTargetApproved()) {
	    logWarn(TRACK_EVENT_ERROR, ERROR_TARGET_NOT_OPTED_IN);
	    options[ERROR](ERROR, ERROR_TARGET_NOT_OPTED_IN);
	    return;
	  }
	  trackImmediateInternal(options);
	}
	function handleEvent(options) {
	  trackImmediate(options);
	  return !options.preventDefault;
	}
	function trackBySelector(options) {
	  const selector = options[SELECTOR];
	  const type = options[TYPE];
	  const elements = toArray(select(selector));
	  const onEvent = () => handleEvent(options);
	  forEach(element => addEventListener(type, onEvent, element), elements);
	}
	function trackEvent(opts) {
	  const validationResult = validateTrackEventOptions(opts);
	  const error = validationResult[ERROR];
	  if (!validationResult[VALID]) {
	    logWarn(TRACK_EVENT, error);
	    addClientTrace({
	      source: TRACK_EVENT,
	      options: opts,
	      error
	    });
	    return;
	  }
	  const config = getConfig();
	  const options = normalizeOptions(config, opts);
	  if (!isDeliveryEnabled() && !isAuthoringEnabled()) {
	    logWarn(TRACK_EVENT, DELIVERY_DISABLED);
	    delay(options[ERROR](WARNING, DELIVERY_DISABLED));
	    addClientTrace({
	      source: TRACK_EVENT,
	      options: opts,
	      error: DELIVERY_DISABLED
	    });
	    return;
	  }
	  logDebug(TRACK_EVENT, options);
	  addClientTrace({
	    source: TRACK_EVENT,
	    options
	  });
	  if (shouldTrackBySelector(options)) {
	    trackBySelector(options);
	    return;
	  }
	  trackImmediate(options);
	}

	const TRIGGER_VIEW = "[triggerView()]";
	const TASKS = [];
	const LOADING = 0;
	const LOADED = 1;
	let STATE = LOADING;
	function executeApplyOffersForView(view) {
	  hideViewOptions(view);
	  return renderView(view).then(handleView).then(execution => {
	    if (isEmpty(execution)) {
	      return;
	    }
	    notifyRenderingSucceeded({
	      execution
	    });
	  })['catch'](error => {
	    logWarn(RENDERING_VIEW_FAILED, error);
	    notifyRenderingFailed({
	      error
	    });
	  });
	}
	function processTriggeredViews() {
	  while (TASKS.length > 0) {
	    const options = TASKS.pop();
	    const {
	      viewName,
	      page
	    } = options;
	    const persistedView = findView(viewName, options);
	    if (!isNil(persistedView)) {
	      executeApplyOffersForView(persistedView);
	      continue;
	    }
	    if (page) {
	      sendViewTriggeredNotifications(options);
	    }
	  }
	}
	function processResponseEvents() {
	  STATE = LOADED;
	  processTriggeredViews();
	}
	function setupListeners() {
	  subscribe(CACHE_UPDATED_EVENT, processResponseEvents);
	  subscribe(NO_OFFERS_EVENT, processResponseEvents);
	  subscribe(REDIRECT_OFFER_EVENT, processResponseEvents);
	}
	function getTriggerViewOptions(viewName, opts) {
	  const result = {};
	  result.viewName = viewName;
	  result.impressionId = uuid();
	  result.page = true;
	  if (!isEmpty(opts)) {
	    result.page = !!opts.page;
	  }
	  return result;
	}
	function handleTriggeredView(options) {
	  TASKS.push(options);
	  if (STATE === LOADING) {
	    return;
	  }
	  processTriggeredViews();
	}
	function triggerView(value, opts) {
	  const viewsEnabled = getConfig()[VIEWS_ENABLED];
	  if (!viewsEnabled) {
	    logWarn(TRIGGER_VIEW, VIEWS_DISABLED);
	    return;
	  }
	  if (!isString(value) || isBlank(value)) {
	    logWarn(TRIGGER_VIEW, VIEW_NAME_ERROR, value);
	    addClientTrace({
	      source: TRIGGER_VIEW,
	      view: value,
	      error: VIEW_NAME_ERROR
	    });
	    return;
	  }
	  const viewName = value.toLowerCase();
	  const options = getTriggerViewOptions(viewName, opts);
	  if (isAuthoringEnabled()) {
	    logDebug(TRIGGER_VIEW, viewName, options);
	    handleAuthoringTriggeredView(options);
	    return;
	  }
	  logDebug(TRIGGER_VIEW, viewName, options);
	  addClientTrace({
	    source: TRIGGER_VIEW,
	    view: viewName,
	    options
	  });
	  handleTriggeredView(options);
	}
	setupListeners();

	const COMMON_MBOX_WARN = "function has been deprecated. Please use getOffer() and applyOffer() functions instead.";
	const REGISTER_EXTENSION_WARN = "adobe.target.registerExtension() function has been deprecated. Please review the documentation for alternatives.";
	const MBOX_CREATE_WARN = "mboxCreate() " + COMMON_MBOX_WARN;
	const MBOX_DEFINE_WARN = "mboxDefine() " + COMMON_MBOX_WARN;
	const MBOX_UPDATE_WARN = "mboxUpdate() " + COMMON_MBOX_WARN;
	function registerExtension() {
	  logWarn(REGISTER_EXTENSION_WARN, arguments);
	}
	function mboxCreate() {
	  logWarn(MBOX_CREATE_WARN, arguments);
	}
	function mboxDefine() {
	  logWarn(MBOX_DEFINE_WARN, arguments);
	}
	function mboxUpdate() {
	  logWarn(MBOX_UPDATE_WARN, arguments);
	}

	function overridePublicApi(win) {
	  win.adobe = win.adobe || {};
	  win.adobe.target = {
	    VERSION: "",
	    event: {},
	    getOffer: noop,
	    getOffers: noopPromise,
	    applyOffer: noop,
	    applyOffers: noopPromise,
	    sendNotifications: noop,
	    trackEvent: noop,
	    triggerView: noop,
	    registerExtension: noop,
	    init: noop
	  };
	  win.mboxCreate = noop;
	  win.mboxDefine = noop;
	  win.mboxUpdate = noop;
	}
	function init(win, doc, settings) {
	  if (win.adobe && win.adobe.target && typeof win.adobe.target.getOffer !== "undefined") {
	    logWarn(ALREADY_INITIALIZED);
	    return;
	  }
	  initConfig(settings);
	  const config = getConfig();
	  const version = config[VERSION];
	  win.adobe.target.VERSION = version;
	  win.adobe.target.event = {
	    LIBRARY_LOADED,
	    REQUEST_START,
	    REQUEST_SUCCEEDED: REQUEST_SUCCEEDED$1,
	    REQUEST_FAILED: REQUEST_FAILED$1,
	    CONTENT_RENDERING_START,
	    CONTENT_RENDERING_SUCCEEDED,
	    CONTENT_RENDERING_FAILED,
	    CONTENT_RENDERING_NO_OFFERS,
	    CONTENT_RENDERING_REDIRECT,
	    ARTIFACT_DOWNLOAD_SUCCEEDED,
	    ARTIFACT_DOWNLOAD_FAILED,
	    GEO_LOCATION_UPDATED
	  };
	  if (!config[ENABLED]) {
	    overridePublicApi(win);
	    logWarn(DELIVERY_DISABLED);
	    return;
	  }
	  initTraces();
	  initAuthoringCode();
	  initQaMode(win);
	  initPreviewMode(win);
	  initDecisioningEngine();
	  initDelivery();
	  win.adobe.target.getOffer = getOffer;
	  win.adobe.target.getOffers = getOffers;
	  win.adobe.target.applyOffer = applyOffer;
	  win.adobe.target.applyOffers = applyOffers;
	  win.adobe.target.sendNotifications = sendNotifications;
	  win.adobe.target.trackEvent = trackEvent;
	  win.adobe.target.triggerView = triggerView;
	  win.adobe.target.registerExtension = registerExtension;
	  win.mboxCreate = mboxCreate;
	  win.mboxDefine = mboxDefine;
	  win.mboxUpdate = mboxUpdate;
	  notifyLibraryLoaded();
	}
	var bootstrapOdd = {
	  init
	};

	return bootstrapOdd;

}());
window.adobe.target.init(window, document, {
  "clientCode": "demo",
  "imsOrgId": "",
  "serverDomain": "localhost:5000",
  "timeout": 2000,
  "globalMboxName": "target-global-mbox",
  "version": "2.0.0",
  "defaultContentHiddenStyle": "visibility: hidden;",
  "defaultContentVisibleStyle": "visibility: visible;",
  "bodyHiddenStyle": "body {opacity: 0 !important}",
  "bodyHidingEnabled": true,
  "deviceIdLifetime": 63244800000,
  "sessionIdLifetime": 1860000,
  "selectorsPollingTimeout": 5000,
  "visitorApiTimeout": 2000,
  "overrideMboxEdgeServer": false,
  "overrideMboxEdgeServerTimeout": 1860000,
  "optoutEnabled": false,
  "optinEnabled": false,
  "secureOnly": false,
  "supplementalDataIdParamTimeout": 30,
  "authoringScriptUrl": "//cdn.tt.omtrdc.net/cdn/target-vec.js",
  "urlSizeLimit": 2048,
  "endpoint": "/rest/v1/delivery",
  "pageLoadEnabled": true,
  "viewsEnabled": true,
  "analyticsLogging": "server_side",
  "serverState": {},
  "decisioningMethod": "server-side",
  "legacyBrowserSupport":  false
}
);
//# sourceMappingURL=at-odd.build.js.map
