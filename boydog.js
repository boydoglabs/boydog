//BoyDog server-side module

'use strict';

module.exports = function(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });
  const diff = require('fast-diff');
  const _ = require('lodash');
  const Changeset = require('changesets').Changeset;
  const CircularBuffer = require('circular-buffer');
  var scope = {};
  var logic = {};
  var __revs = {};
  
  //
  //Utilities
  //
  
  //Send patch with latency (for debugging only, chrome throttle does not work for WebSockets)
  function socketSendWithLatency(bone, socket, latency) {
    (function(data, socket, latency) {
      setTimeout(function() {
        
        console.log("sending with latency")
        
        socket.send(bone);
      }, latency) //Client latency
    })(bone, socket, latency);
  }
  
  //TODO: Broadcast patch with latency (for debugging only, chrome throttle does not work for WebSockets)
  
  //Changeset shorthand
  function cset(parent, val) { return Changeset.fromDiff(diff(parent, val)) }
  
  var canonicalizePath = function(str) {
    var attr = _.toPath(str);
    
    if (attr.length > 1) {
      attr = _.map(attr, function(item, i) {
        if (i === 0) return item;
        
        if((item[0] === "#") || ((item[0] === "."))) return item;
          
        return "'" + item + "'";
      })
      
      attr = attr.shift() + "[" + attr.join("][") + "]";
    } else {
      attr = attr.shift();
    }
    
    return attr;
  }
  
  //
  //Boy functions
  //
  
  //Assign boy's data and logic
  var assign = function(_scope, _logic) {
    if (_scope) scope = _scope;
    if (_logic) logic = _logic;
  }
  
  /*//dog-run currently disabled
  var run = function(data) {
    var mask = _.get(logic, data.path);
      
    if (mask === null) return;
    
    if (mask !== undefined) {
      if (mask.__run) return mask.__run(data);
    }
  }*/
  
  /*//Not used (may be included in newer versions)
  var forwardPropagate = function(startPoint) {
    var sp;
    var keysArray = [];
    
    if (!startPoint || (startPoint === ".")) {
      sp = scope;
    } else {
      sp = _.get(scope, startPoint);
    }
    
    function walkKeys(val, key, subPath) {
      var tmpArr = subPath.slice();
      if (key) tmpArr.push(key);
      
      //if (!_.isArray(keysArray[tmpArr.length])) keysArray[tmpArr.length] = [];
      //keysArray[tmpArr.length].push(tmpArr);
      
      _.each(val, function(v, k) {
        if (_.isObject(v) || _.isArray(v)) {
          return walkKeys(v, k, tmpArr);
        }
        
        //if (!_.isArray(keysArray[tmpArr.length + 1])) keysArray[tmpArr.length + 1] = [];
        //keysArray[tmpArr.length + 1].push(tmpArr);
      })
    }
    
    walkKeys(sp, undefined, []);
  }*/
  
  var give = function(bone) {
    //Execute the last item __giveBone
    let mask = _.get(logic, bone.path);
    if (mask === null) return;
    if (mask !== undefined) {
      if (mask.__giveBone === null) return;
      if (mask.__giveBone) bone = mask.__giveBone(bone);
    }
    if (bone === undefined) return;
    
    //Execute middleware functions to the actual value
    let fullPath = _.toPath(bone.path);
    let tmpPath;
    for (let i = 1; i < fullPath.length; i++) { //Note that we *don't* take the very last item, as this item is not part of the middleware
      //tmpPath = _.take(fullPath, i); //Verse
      tmpPath = _.take(fullPath, (fullPath.length - i)); //Inverse
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
  }
  
  var take = function(bone) {
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
    for (var i = 1; i < fullPath.length; i++) { //Note that we *don't* take the very last item, as this item is not part of the middleware
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
    let mask = _.get(logic, bone.path);
    if (mask === null) return;
    if (mask !== undefined) {
      if (mask.__takeBone === null) return;
      if (mask.__takeBone) bone = mask.__takeBone(bone);
    }
    if (bone === undefined) return;
    
    //Begin value commit
    if (__revs[bone.path] === undefined) __revs[bone.path] = new CircularBuffer(100); //Create a revision circular buffer if it doesn't exists
    
    //Generate OT revision if needed and add changeset
    let lastRev = __revs[bone.path].get(0);
    if (bone.rev > lastRev.rev || lastRev.length === 0) {
      __revs[bone.path].enq(_.omit(bone, 'socket'));
      
      const cs = cset(bone.parent, bone.val);
      _.set(scope, bone.path, cs.apply(_.get(scope, bone.path)));
      
      give(bone);
    } else {
      const x = cset(bone.parent, bone.val);
      
      let searchRev = __revs[bone.path].get(0).rev - bone.rev;
      if (searchRev > __revs[bone.path]._capacity) {
        //If the client is too out-of-date
        const newRev = { path: bone.path, rev: __revs[bone.path].get(0).rev, parent: __revs[bone.path].get(0).parent, val: __revs[bone.path].get(0).val, socket: bone.socket };
        give(newRev);
        
        return;
      }
      
      let found = false;
      do {
        if (__revs[bone.path].get(searchRev).parent !== bone.parent) {
          searchRev--;
        } else {
          found = true;
        }
      } while(!found && (searchRev >= 0));
      
      let m; //Let m be merge changeset
      if (found) {
        m = cset(__revs[bone.path].get(searchRev).parent, __revs[bone.path].get(searchRev).val); //Set first m
        
        for (let i = searchRev - 1; i >= 0; i--) {
          const csTemp = cset(__revs[bone.path].get(i).parent, __revs[bone.path].get(i).val);
          m = m.merge(csTemp);
        }
      } else {
        searchRev = 0;
        m = cset(bone.parent, __revs[bone.path].get(searchRev).val);
      }
      
      try {
        const newVal = m.transformAgainst(x).apply(bone.val);
        
        if (newVal === undefined) throw new Error("Can't transform changeset");
        
        const newRev = { path: bone.path, rev: __revs[bone.path].get(0).rev + 1, parent: __revs[bone.path].get(0).val, val: newVal, socket: bone.socket };
        __revs[bone.path].enq(newRev);
        _.set(scope, bone.path, newVal);
        
        give(newRev);
      } catch (e) {
        //TODO: Implement a fallback just in case?
        console.log("OT error", e);
      }
    }
    
    if (bone.val !== bone.parent) {
      wss.broadcast(JSON.stringify([bone.path]), bone.socket); //Inform all users that they need to update this value
    }
  }
  
  //Will give a bone without val to all connected users so that they request an update on that path (or on all paths)
  var refresh = function(paths) {
    if (_.isString(paths)) { //If paths is only a single path string
      wss.broadcast(JSON.stringify({ path: canonicalizePath(paths) })); //Refresh the specific route
    } else if (_.isArray(paths)) {
      _.each(paths, function(path) { //For each route
        wss.broadcast(JSON.stringify({ path: canonicalizePath(path) })); //Refresh the specific route
      })
    } else {
      //TODO: Implement something like `io.emit('refresh');` //Refresh all routes (careful, this is expensive)
    }
  }
  
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
  
  wss.on('connection', function connection(socket) {
    //const location = url.parse(req.url, true);
    //You might use location.query.access_token to authenticate or share sessions or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
   
    socket.on('message', function incoming(bone) {
      //(function sleep(delay) { var start = new Date().getTime(); while (new Date().getTime() < start + delay);})(1000); //Debug delay
      var bone = JSON.parse(bone);
      
      bone.socket = socket;
      take(bone);
    });
    
    socket.on('error', function (err) {
      if (err.code !== 'ECONNRESET') {
        //Ignore ECONNRESET, throw all else
        throw err;
      }
    })
  });
  
  //Module exposed functions
  return {
    assign: assign,
    give: give,
    take: take,
    refresh: refresh
  }
}