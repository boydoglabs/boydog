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
  var monitor;
  var documentScope = {};
  var scope;
  
  /*var doc = connection.get("default", "randomABC");
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create({ content: "abc123" }, () => {
        console.log("created");
      });
      return;
    }
  });*/
  
  //Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({ server });
  wss.on("connection", function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });
  
  var restart = function() {
    console.log("restarting boy with scope", scope);
    
    (async() => {
      let hasTitle = await monitor.title();
      if (!hasTitle) return;
      
      Object.keys(scope).forEach((path) => {
        let value = scope[path];
        
        console.log("EACH scope", path, value)
        documentScope[path] = connection.get("default", path);
        
        documentScope[path].fetch(function(err) {
          if (err) throw err;
          if (documentScope[path].type === null) {
            documentScope[path].create({ content: value }, () => {
              console.log("created", path, "with", value);
            });
            return;
          }
        });
      })
      
      //TODO: Populate monitor
      
      /*//Working writing sample
      await monitor.focus('#test');
      await monitor.keyboard.type('server connected');*/
    })();
  }
  
  var attach = function(_scope) {
    if (!_scope) return;
    
    scope = _scope;
    
    (async() => {
      const browser = await puppeteer.launch({ headless: false });
      monitor = await browser.newPage();
      await monitor.goto(`localhost:${ server._connectionKey.split("::::")[1] }`); //Note: This way of getting the server's port may not be very reliable...
      restart();
    })();
  };

  return { scope, attach, restart };
};
