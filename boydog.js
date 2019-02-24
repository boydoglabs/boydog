//BoyDog server module

"use strict";

module.exports = function(server) {
  var ShareDB = require("sharedb");
  var WebSocket = require("ws");
  var WebSocketJSONStream = require("websocket-json-stream");
  var backend = new ShareDB();
  var connection = backend.connect();
  
  const puppeteer = require('puppeteer');
  var page;
  
  var _mirror = {};
  var test = 50;
  var scope;

  var doc = connection.get("examples", "randomABC");
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create({ content: "abc123" }, () => {
        console.log("created");
      });
      return;
    }
  });

  //Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({ server });
  wss.on("connection", function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });
  
  var reload = function() {
    console.log("reloading boy with scope", scope);
    
    (async() => {
      let tt = await page.title();
      if (!tt) return;
      await page.focus('#test');
      await page.keyboard.type('server connected');
    })();
    
  }
  
  var attach = function(_scope) {
    if (!_scope) return;
    
    scope = _scope;
    
    (async() => {
      const browser = await puppeteer.launch({ headless: false });
      page = await browser.newPage();
      await page.goto(`localhost:${ server._connectionKey.split("::::")[1] }`); //Note: This way of getting the server's port may not be very reliable...
      reload();
    })();
  };

  return { scope, attach, reload, doc };
};
