# Proxy Configuration Sample

## Overview

It is possible to configure a proxy for the Node SDK's HTTP requests. This is possible by overriding the `fetch` API used by the SDK during initialization.

This sample contains three different code snippets that demonstrate how to configure the SDK with a proxy, depending on which node version the SDK runs on:  

- [Node 18.2+](proxy-sample-node-18.js) (`undici.fetch` is the default `fetch`)
- [Node 16.8+](proxy-sample-node-16.js) (`undici.fetch` needs to be imported)
- [Node 14+](proxy-sample-node-14.js) (the proxy is configured with `node-fetch`)

The difference in proxy configurations is due to differences in the fetch implementations between Node versions. 
Starting with Node 18.2, the default implementation of `fetch` switched to `undici.fetch`. 
However, `unidici.fetch` is only supported in Node 16.8+. Users are welcome to choose their own `fetch` and proxy client configurations. 
These samples only serve as guidance for those considering adding a proxy to their SDK HTTP calls. 

## Usage

1. `npm start` to start a local proxy server
2. in a separate window, run `node proxy-sample-node-[version]` to initialize a sample Target Client and make a `getOffers` call with a proxy configured
