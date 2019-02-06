//BoyDog server-side module

"use strict";

module.exports = function(server) {
  const WebSocket = require("ws");
  const wss = new WebSocket.Server({ server });
  const _ = require("lodash");
  var scope = {};
  var logic = {};
  var __revs = {};

  //
  //Utilities
  //

  //Send patch with latency (for debugging only, note that Chrome's throttle does not work for WebSockets)
  function socketSendWithLatency(bone, socket, latency) {
    (function(data, socket, latency) {
      setTimeout(function() {
        console.log(
          "DEBUG: Sending packets with latency, remember to remove latency before publishing"
        );
        socket.send(bone);
      }, latency);
    })(bone, socket, latency);
  }

  var canonicalizePath = function(str) {
    var attr = _.toPath(str);

    if (attr.length > 1) {
      attr = _.map(attr, function(item, i) {
        if (i === 0) return item;

        if (item[0] === "#" || item[0] === ".") return item;

        return "'" + item + "'";
      });

      attr = attr.shift() + "[" + attr.join("][") + "]";
    } else {
      attr = attr.shift();
    }

    return attr;
  };

  //
  //Boy functions
  //

  //Assign boy's data and logic
  var assign = function(_scope, _logic) {
    if (_scope) scope = _scope;
    if (_logic) logic = _logic;
  };

  var give = function(bone) {
    let mask;

    //Execute the last item __giveBone
    mask = _.get(logic, bone.path);
    if (mask === null) return;
    if (mask !== undefined) {
      if (mask.__giveBone === null) return;
      if (mask.__giveBone) bone = mask.__giveBone(bone);
    }
    if (bone === undefined) return;

    //Execute middleware functions to the actual value
    let fullPath = _.toPath(bone.path);
    let tmpPath;
    for (let i = 1; i < fullPath.length; i++) {
      //Note: Last item is not part of the middleware
      //tmpPath = _.take(fullPath, i); //Verse
      tmpPath = _.take(fullPath, fullPath.length - i); //Inverse
      mask = _.get(logic, tmpPath);
      if (mask === null) return;
      if (mask === undefined) continue;
      //TODO: Implement __givetake middleware
      if (logic.__giveBone === null) return;
      if (mask.__giveBone) bone = mask.__giveBone(bone);
    }
    if (bone === undefined) return;

    //Execute logic top level middleware
    if (logic === null) return;
    if (logic !== undefined) {
      //TODO: Implement __givetake middleware
      if (logic.__giveBone === null) return;
      if (logic.__giveBone) bone = logic.__giveBone(bone);
    }
    if (bone === undefined) return;

    //Send bone
    bone.socket.send(JSON.stringify(_.omit(bone, "socket")));
  };

  var take = function(bone) {
    let mask;

    //Deal with an uninitialized scope field
    let currentValue = _.get(scope, bone.path);
    if (!isNaN(currentValue)) currentValue = currentValue.toString();

    //Deal with bone that only ask for `bone.path` update
    if (bone.val === undefined) {
      give({ path: bone.path, val: currentValue, socket: bone.socket }); //Send the latest version

      return;
    }

    //Execute logic top level middleware
    if (logic === null) return;
    if (logic !== undefined) {
      //TODO: Implement __givetake middleware
      if (logic.__takeBone === null) return;
      if (logic.__takeBone) bone = logic.__takeBone(bone);
    }
    if (bone === undefined) return;

    //Execute path to the actual value middleware
    let fullPath = _.toPath(bone.path);
    let tmpPath;
    for (var i = 1; i < fullPath.length; i++) {
      //Note: Last item is not part of the middleware
      tmpPath = _.take(fullPath, i); //Verse
      //tmpPath = _.take(fullPath, (fullPath.length - i)); //Inverse
      mask = _.get(logic, tmpPath);
      if (mask === null) return;
      if (mask === undefined) continue;
      //TODO: Implement __givetake middleware
      if (mask.__takeBone === null) return;
      if (mask.__takeBone) bone = mask.__takeBone(bone);
    }
    if (bone === undefined) return;

    //Execute the last item __takeBone
    mask = _.get(logic, bone.path);
    if (mask === null) return;
    if (mask !== undefined) {
      if (mask.__takeBone === null) return;
      if (mask.__takeBone) bone = mask.__takeBone(bone);
    }
    if (bone === undefined) return;

    if (!bone.kind || bone.kind === "fifo") {
      if (bone.val === bone.parent) return;

      _.set(scope, bone.path, bone.val);
      refresh(bone.path, bone.socket);

      give(bone);
    } else if (bone.kind === "fifo-hardlock") {
      //Not yet implemented
    } else if (bone.kind === "fifo-softlock") {
      //Not yet implemented
    } else if (bone.kind === "ot") {
      //Not yet implemented
    }
  };

  //Will give a bone without val to all connected users so that they request an update on that path (or on all paths)
  var refresh = function(paths, except) {
    if (_.isString(paths)) {
      //If paths is only a single path string
      wss.broadcast(JSON.stringify({ path: canonicalizePath(paths) }), except); //Refresh the specific route
    } else if (_.isArray(paths)) {
      _.each(paths, function(path) {
        //For each route
        wss.broadcast(JSON.stringify({ path: canonicalizePath(path) }), except); //Refresh the specific route
      });
    } else {
      //TODO: Implement something like `io.emit('refresh');` //Refresh all routes (careful, this is expensive)
    }
  };

  //
  //WebSocket events and functions
  //

  //Broadcast to all except a specific client
  wss.broadcast = function broadcast(data, except) {
    wss.clients.forEach(function each(client) {
      if (client !== except && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  wss.on("connection", function connection(socket) {
    //const location = url.parse(req.url, true);
    //You might use location.query.access_token to authenticate or share sessions or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    socket.on("message", function incoming(bone) {
      //Deal with ping messages
      if (bone === ">") {
        socket.send("<");

        return;
      }

      //Deal with bone messages
      var bone = JSON.parse(bone);

      bone.socket = socket;
      take(bone);
    });

    socket.on("error", function(err) {
      if (err.code !== "ECONNRESET") {
        //Ignore ECONNRESET, throw all else
        throw err;
      }
    });
  });

  //Module exposed functions
  return {
    assign: assign,
    give: give,
    take: take,
    refresh: refresh
  };
};
