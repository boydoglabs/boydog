//BoyDog server module

"use strict";

module.exports = function(server) {
  var ShareDB = require("sharedb");
  var WebSocket = require("ws");
  var WebSocketJSONStream = require("websocket-json-stream");
  const puppeteer = require('puppeteer');
  var backend = new ShareDB();
  var connection = backend.connect();
  
  //Add "/boydog-client" as an express Express route
  server._events.request.get("/boydog-client", function(req, res) {
    return res.sendFile('./node_modules/boydog-client/build/boydog-client.js', { root: __dirname });
  })
  
  //Boydog variables
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
