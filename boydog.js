//BoyDog server module

"use strict";

module.exports = function(server) {
  require("dotenv").config();

  const fs = require("fs");
  const path = require("path");
  const ShareDB = require("sharedb");
  const WebSocket = require("ws");
  const WebSocketJSONStream = require("websocket-json-stream");
  const _ = require("lodash");
  const ejs = require("ejs");
  const puppeteer = require("puppeteer");
  const createHash = require("hash-generator");
  const shareDbAccess = require("sharedb-access");
  const backend = new ShareDB();
  const connection = backend.connect();
  const assert = require("chai").assert;

  //Boydog variables
  var monitor;
  var documentScope = {};
  var options = {
    monitorBasicAuth: createHash(32), //Set a hard to guess hash
  };
  //Scope vars
  var scope;
  var logic;
  var _getScope = {}; //The scope mirror that retains actual values as a flat object, only because "get" ObjectProperty does not accepts async functions

  //ShareDb Session middleware
  backend.use("connect", (request, next) => {
    if (!_.isUndefined(request.req))
      request.agent.connectSession = { userId: request.req.userId };

    next();
  });

  //ShareDb Access module
  shareDbAccess(backend);

  backend.allowRead("default", async (docId, doc, session) => {
    //Triggered when reading. Note that "reading" happens only once when a client is connected, after that, only updates are issued, even other clients will not trigger a "read" again
    //TODO: Implement auth middleware here
    return true;
  });

  backend.allowUpdate(
    "default",
    async (docId, oldDoc, newDoc, ops, session) => {
      //TODO: Implement auth middleware here
      return true;
    }
  );

  //Add "/boydog-client" as an express Express route
  server._events.request.get("/boydog-client", function(req, res) {
    return res.sendFile("/boydog-client/build/boydog-client.js", {
      root: __dirname + "/..", //Get to "node_modules" folder
    });
  });

  //Add "/boydog-monitor/..." as an express Express route
  server._events.request.get("/boydog-monitor/:monitorBasicAuth", function(
    req,
    res
  ) {
    if (req.params.monitorBasicAuth !== options.monitorBasicAuth)
      return res.redirect("/");

    let getFieldsArray = (root, pre) => {
      if (!pre) {
        pre = "";
      }
      return _.flattenDeep(
        _.map(root, (v, k) => {
          if (_.isObjectLike(v)) {
            return [pre + k].concat(getFieldsArray(v, pre + k + ">"));
          }
          return pre + k;
        })
      );
    };
    let scopeArray = getFieldsArray(scope);

    fs.readFile(
      path.join(__dirname, "/monitor/default-monitor.ejs"),
      "utf8",
      (err, contents) => {
        if (err || !contents)
          return res.status(500).send("Error. Monitor file not found.");
        return res.send(ejs.render(contents, { scopeArray }));
      }
    );
  });

  //Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({ server });
  wss.on("connection", function(ws, req) {
    let stream = new WebSocketJSONStream(ws);
    let userId = req.url.split("?userId=")[1];

    backend.listen(stream, { userId });
  });

  const writeThroughMonitor = (dogPath, dogValue) => {
    _getScope[dogPath] = dogValue;

    monitor.evaluate(
      (_dogPath, _dogValue) => {
        let el = document.querySelector(_dogPath);
        el.value = _dogValue;
        el.dispatchEvent(new Event("input")); //Trigger a change, hence a send operation. Note that if the old and new content is the same no operation will *not* be send anyway
      },
      `[dog-value='${dogPath}']`,
      dogValue
    );
  };

  const restart = async function() {
    console.info("Restarting boy");

    let hasTitle = await monitor.title();
    if (!hasTitle) return;

    if (!_.isPlainObject(scope))
      throw new Error("Scope must be a plain object.");

    const iterateScope = (root, prePath) => {
      if (!prePath) prePath = [];

      _.each(root, (value, path) => {
        let fullPath = prePath.concat([path]).join(">");

        if (_.isPlainObject(root[path])) {
          //If current field is {} or []
          documentScope[fullPath] = connection.get("default", fullPath); //Create document connection

          //Try to fetch the document, otherwise create it
          documentScope[fullPath].fetch((err) => {
            if (err) throw err;

            if (documentScope[fullPath].type !== null) return;

            documentScope[fullPath].create(
              { content: JSON.stringify(value) },
              (err) => {
                if (err) throw err;

                _getScope[fullPath] = JSON.stringify(value);
              }
            );
          });

          prePath.push(path);
          iterateScope(root[path], prePath);
        } else if (_.isString(root[path])) {
          //If current field is "" or ''
          documentScope[fullPath] = connection.get("default", fullPath); //Create document connection
          //Try to fetch the document, otherwise create it
          documentScope[fullPath].fetch((err) => {
            if (err) throw err;

            if (documentScope[fullPath].type !== null) return;

            documentScope[fullPath].create({ content: value }, (err) => {
              if (err) throw err;

              _getScope[fullPath] = value; //Set initial value just after creation

              //Define scope getters & setters when setting scope from the boy
              Object.defineProperty(root, path, {
                set: (v) => {
                  writeThroughMonitor(fullPath, v);

                  return v;
                },
                get: (v) => {
                  return _getScope[fullPath];
                },
              });

              //Subscribe to operation events and update "scope" accordingly
              documentScope[fullPath].subscribe((err) => {
                assert.notExists(err);

                //Note: The "on before" is not exactly a "before" operation event, and operations are already applied when the event is triggered. Changing the op inside this event is not useful.
                //A "op" event is triggered "after" the operation has been applied
                documentScope[fullPath].on("op", (op, source) => {
                  //Get latest value
                  documentScope[fullPath].fetch((err) => {
                    assert.notExists(err);

                    let initialValue = documentScope[fullPath].data.content;

                    //Process middleware
                    let finalValue = ((value) => {
                      //Process top level middleware
                      if (logic === null) return value;
                      if (logic !== undefined) {
                        if (logic._write === null) return value;
                        if (typeof logic._write === "function")
                          value = logic._write(value);
                      }

                      return value;
                    })(initialValue);

                    _getScope[fullPath] = finalValue; //Although `_getScope` is updated inside `writeThroughMonitor`, it is still needed to update it here
                    if (initialValue !== finalValue)
                      writeThroughMonitor(fullPath, finalValue);

                    if (fullPath.indexOf(">") < 0) return;
                    //Check if it is a child of a parent and then update parent
                    let parents = fullPath.split(">");
                    parents.pop(); //Take out the current field as it has been already updated above

                    let parentPath = parents.join(">");
                    let finalParentValue = JSON.stringify(scope[parentPath]);

                    writeThroughMonitor(parentPath, finalParentValue);
                  });
                });
              });
            });
          });
        }
      });
    };

    iterateScope(scope);
  };

  const attach = function(_scope, _logic) {
    if (!_scope) return;

    console.info(
      `Attaching boy. Monitor will be available at /boydog-monitor/${options.monitorBasicAuth}`
    );

    scope = _scope;
    logic = _logic || {};

    //Start Puppeteer monitor
    (async () => {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
        headless: !+process.env.SHOW_MONITOR,
      });
      monitor = await browser.newPage();
      await monitor.goto(
        `http://localhost:${
          server._connectionKey.split("::::")[1]
        }/boydog-monitor/${options.monitorBasicAuth}`
      );
      restart();
    })();
  };

  return { scope, attach, restart };
};
