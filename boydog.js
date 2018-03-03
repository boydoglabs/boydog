//BoyDog server-side module

'use strict';

module.exports = function(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });
  const diff = require('fast-diff');
  const Changeset = require('changesets').Changeset;
  const _ = require('lodash');
  var scope = {};
  var logic = {};
  
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
  
  var word = ""; //TEMP DEBUG
  let revs = [];
  
  var give = function(bone) {
    console.log("give", _.omit(bone, "socket"));
    
  }
  
  var take = function(bone) {
    console.log("take", _.omit(bone, "socket"));
    
    if (bone.rev >= revs.length) {
      console.log("new rev, current word", word);
      revs.push(_.omit(bone, 'socket'));
      
      const cs = cset(bone.parent, bone.val);
      word = cs.apply(word);
      
      console.log("generated word", word);
      
      bone.socket.send(JSON.stringify(_.omit(bone, "socket")));
    } else {
      console.log("rev recalculation needed");
      
      const x = cset(bone.parent, bone.val);
      
      console.log("DEBUG pre", bone.rev, bone.parent, bone.val, revs[bone.rev].parent, revs[bone.rev].val)
      
      let found = false;
      do {
        if (revs[bone.rev].parent !== bone.parent) {
          bone.rev++;
        } else {
          found = true;
        }
      } while(!found && (revs[bone.rev] !== undefined));
      
      let m;
      if (found) {
        m = cset(revs[bone.rev].parent, revs[bone.rev].val);
      } else {
        bone.rev = revs.length - 1;
        m = cset(bone.parent, revs[bone.rev].val);
      }
      
      for (let i = bone.rev + 1; i < revs.length; i++) {
        console.log(revs[i]);
        const csTemp = cset(revs[i].parent, revs[i].val);
        m = m.merge(csTemp);
      }
      
      console.log("DEBUG post", bone.rev, bone.parent, bone.val, revs[bone.rev].parent, revs[bone.rev].val)
      
      try {
        const newVal = m.transformAgainst(x).apply(bone.val);
        
        if (newVal === undefined) throw new Error("Can't transform changeset");
        
        console.log("m", m, "newVal", newVal);
        
        const newRev = { rev: revs.length, parent: revs[revs.length - 1].val, val: newVal };
        revs.push(newRev);
        word = newVal;
        
        bone.socket.send(JSON.stringify(newRev));
      } catch (e) {
        console.log("err", e);
        
        //TODO: Implement a fallback just in case?
        //serverToClient({ sync: true }, $("#" + who + "latency").val(), who); //Not working
      }
    }
    
    if (bone.val !== bone.parent) {
      wss.broadcast(JSON.stringify(['word']), bone.socket); //Inform all users that they need to update this value
    }
  }
  
  //Will give a bone without val to all connected users so that they request an update on that path (or on all paths)
  var refresh = function(paths) {
    if (_.isString(paths)) { //If paths is in fact only a single path
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