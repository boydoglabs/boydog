//BoyDog server module

"use strict";

module.exports = function(server) {
  const fs = require("fs");
  var path = require("path");
  var ShareDB = require("sharedb");
  var WebSocket = require("ws");
  var WebSocketJSONStream = require("websocket-json-stream");
  const _ = require("lodash");
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
  var _scope = {}; //The scope mirror that retains actual values as a flat object

  //Add "/boydog-client" as an express Express route
  server._events.request.get("/boydog-client", function(req, res) {
    return res.sendFile("/boydog-client/build/boydog-client.js", {
      root: __dirname + "/.." //Get to "node_modules" folder
    });
  });

  //Add "/boydog-monitor/..." as an express Express route
  server._events.request.get("/boydog-monitor/:monitorBasicAuth", function(
    req,
    res
  ) {
    if (req.params.monitorBasicAuth !== options.monitorBasicAuth)
      return res.redirect("/");

    var ff = (cc, pre) => {
      if (!pre) pre = "";
      return _.flattenDeep(
        _.map(cc, (v, k) => {
          if (!_.isObjectLike(v)) {
            return pre + "." + k;
          }
          return ff(v, pre + "." + k);
        })
      );
    };
    let scopeArray = ff(scope).map(el => {
      return el.substr(1);
    });

    fs.readFile(
      path.join(__dirname, "/monitor/default-monitor.ejs"),
      "utf8",
      (err, contents) => {
        if (err || !contents)
          return res.status(500).send("Error. Monitor file not found.");
        return res.send(
          ejs.render(contents, { scopeArray })
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

    if (!_.isPlainObject(scope))
      throw new Error("Scope must be a plain object.");

    const iterateScope = (root, prePath) => {
      if (!prePath) prePath = [];

      _.each(root, (value, path) => {
        let fullPath = prePath.concat([path]).join(".");
        //console.log("flulPath", fullPath);

        if (_.isPlainObject(root[path])) {
          //If current field is {} or []
          console.log("is {} or []", fullPath);
          prePath.push(path);
          iterateScope(root[path], prePath);
        } else if (_.isString(root[path])) {
          //If current field is ""
          console.log("is string, fullpath", fullPath);
          //Populate document scope
          documentScope[fullPath] = connection.get("default", fullPath); //Create document connection
          //Try to fetch the document, otherwise create it
          documentScope[fullPath].fetch(err => {
            if (err) throw err;
            if (documentScope[fullPath].type === null) {
              documentScope[fullPath].create({ content: value }, err => {
                if (err) throw err;
                _scope[fullPath] = value;
                //Subscribe to operation events and update "scope" accordingly
                documentScope[fullPath].subscribe(err => {
                  if (err) throw err;
                  documentScope[fullPath].on("op", (op, source) => {
                    //Get latest value
                    documentScope[fullPath].fetch(err => {
                      if (err) throw err;
                      _scope[fullPath] = documentScope[fullPath].data.content; //Update _scope which has the actual values
                    });
                  });
                });

                //console.log("about to define prop for", root, " at ", fullPath);

                //Define scope getters & setters
                Object.defineProperty(root, path, {
                  set: v => {
                    monitor.evaluate(
                      (fullPath, v) => {
                        let el = document.querySelector(
                          `[dog-value=${fullPath}]`
                        );
                        el.value = v;
                        el.dispatchEvent(new Event("input")); //Trigger a change
                      },
                      fullPath,
                      v
                    );
                  },
                  get: v => {
                    return _scope[fullPath];
                  }
                });
              });

              return;
            }
          });
        }
      });
    };

    iterateScope(scope);
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
      //await monitor.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"); //Note: Sending this header may be needed in the future
      await monitor.goto(
        `http://localhost:${
          server._connectionKey.split("::::")[1]
        }/boydog-monitor/${options.monitorBasicAuth}`
      ); //Note: This way of getting the server's port may not be very reliable...
      restart();
    })();
  };

  return { scope, attach, restart };
};
