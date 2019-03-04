//BoyDog server module

"use strict";

module.exports = function(server) {
  const fs = require("fs");
  var path = require("path");
  var ShareDB = require("sharedb");
  var WebSocket = require("ws");
  var WebSocketJSONStream = require("websocket-json-stream");
  const ejs = require("ejs");
  const puppeteer = require("puppeteer");
  const createHash = require("hash-generator");
  var backend = new ShareDB();
  var connection = backend.connect();

  //Boydog variables
  var monitor;
  var documentScope = {};
  var options = {
    monitorBasicAuth: createHash(32) //Set a hard to guess hash
  };
  //Scope vars
  var scope;
  var _scope = {}; //The scope mirror that retains actual values

  //Add "/boydog-client" as an express Express route
  server._events.request.get("/boydog-client", function(req, res) {
    return res.sendFile("./node_modules/boydog-client/build/boydog-client.js", {
      root: __dirname
    });
  });

  //Add "/boydog-monitor/..." as an express Express route
  server._events.request.get("/boydog-monitor/:monitorBasicAuth", function(
    req,
    res
  ) {
    if (req.params.monitorBasicAuth !== options.monitorBasicAuth)
      return res.redirect("/");

    fs.readFile(
      path.join(__dirname, "/monitor/default-monitor.ejs"),
      "utf8",
      (err, contents) => {
        if (err || !contents)
          return res.status(500).send("Error. Monitor file not found.");
        return res.send(
          ejs.render(contents, { scopeArray: Object.keys(scope) })
        );
      }
    );
  });

  //Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({ server });
  wss.on("connection", function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });

  var restart = async function() {
    console.warn("Restarting boy");

    let hasTitle = await monitor.title();
    if (!hasTitle) return;

    Object.keys(scope).forEach(path => {
      let value = scope[path];

      //Populate document scope
      documentScope[path] = connection.get("default", path); //Create document connection
      //Try to fetch the document, otherwise create it
      documentScope[path].fetch(err => {
        if (err) throw err;
        if (documentScope[path].type === null) {
          documentScope[path].create({ content: value }, () => {
            //Subscribe to operation events and update "scope" accordingly
            documentScope[path].subscribe(err => {
              documentScope[path].on("op", (op, source) => {
                //Get latest value
                documentScope[path].fetch(err => {
                  if (err) throw err;
                  _scope[path] = documentScope[path].data.content; //Update _scope which has the actual values
                });
              });
            });

            //Define scope getters & setters
            Object.defineProperty(scope, path, {
              set: v => {
                monitor.evaluate(
                  (path, v) => {
                    let el = document.querySelector(`[dog-value=${path}]`);
                    el.value = v;
                    el.dispatchEvent(new Event("input")); //Trigger a change
                  },
                  path,
                  v
                );
              },
              get: v => {
                return _scope[path];
              }
            });
          });

          return;
        }
      });
    });
  };

  var attach = function(_scope) {
    if (!_scope) return;
    console.info(
      `Restarting boy, monitor is available at /boydog-monitor/${
        options.monitorBasicAuth
      }`
    );

    scope = _scope;

    (async () => {
      const browser = await puppeteer.launch({ headless: true });
      monitor = await browser.newPage();
      await monitor.goto(
        `localhost:${server._connectionKey.split("::::")[1]}/boydog-monitor/${
          options.monitorBasicAuth
        }`
      ); //Note: This way of getting the server's port may not be very reliable...
      restart();
    })();
  };

  return { scope, attach, restart };
};
