//BoyDog boy (server) module

'use strict';

module.exports = function(server) {
  var io = require('socket.io')(server);
  var _ = require('lodash');
  var scope = {};
  var logic = {};
  
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
    var mask;
    var tmpPath;
    
    //Execute the last item __give
    mask = _.get(logic, bone.path);
    
    if (mask === null) return;
    
    if (mask !== undefined) {
      if (mask.__give === null) return;
      if (mask.__give) bone = mask.__give(bone);
    }
    
    //Execute middleware functions to the actual value
    var fullPath = _.toPath(bone.path);
    for (var i = 1; i < fullPath.length; i++) { //Note that we *don't* take the very last item, as this item is not part of the middleware
      //tmpPath = _.take(fullPath, i); //Verse
      tmpPath = _.take(fullPath, (fullPath.length - i)); //Inverse
      
      mask = _.get(logic, tmpPath);
      
      if (mask === null) return;
      if (mask === undefined) continue;
      
      //TODO: Implement __givetake middleware
      
      if (logic.__give === null) return;
      if (mask.__give) bone = mask.__give(bone);
    }
    
    //Execute logic top level middleware
    if (logic === null) return;
    
    if (logic !== undefined) {
      //TODO: Implement __givetake middleware
      
      if (logic.__give === null) return;
      if (logic.__give) bone = logic.__give(bone);
    }
    
    if (bone === undefined) return;
    bone.socket.emit('give', _.omit(bone, 'socket')); //Remove socket info and send bone to the client
  }
  
  var take = function(bone) {
    var mask;
    var tmpPath;
    
    console.log("bone so far", _.omit(bone, 'socket'))
    
    //Execute logic top level middleware
    if (logic === null) return;
    if (logic !== undefined) {
      //TODO: Implement __givetake middleware
      
      if (logic.__take === null) return;
      if (logic.__take) bone = logic.__take(bone);
    }
    
    console.log("bone so far", _.omit(bone, 'socket'))
    
    //Execute path to the actual value middleware
    var fullPath = _.toPath(bone.path);
    for (var i = 1; i < fullPath.length; i++) { //Note that we *don't* take the very last item, as this item is not part of the middleware
      tmpPath = _.take(fullPath, i); //Verse
      //tmpPath = _.take(fullPath, (fullPath.length - i)); //Inverse
      
      mask = _.get(logic, tmpPath);
      
      if (mask === null) return;
      if (mask === undefined) continue;
      
      //TODO: Implement __givetake middleware
      
      if (mask.__take === null) return;
      if (mask.__take) bone = mask.__take(bone);
    }
    
    console.log("bone so far", _.omit(bone, 'socket'))
    
    //Execute the last item __take
    mask = _.get(logic, bone.path);
    
    if (mask === null) return;
    
    if (mask !== undefined) {
      if (mask.__take === null) return;
      if (mask.__take) bone = mask.__take(bone);
    }
    
    console.log("received bone", _.omit(bone, 'socket'))
    
    if (bone === undefined) return;
    if (bone.val === undefined) { //When only asking for a value
      bone.val = _.get(scope, bone.path); //Get value from scope
      if (bone.val !== undefined) give(_.pick(bone, ['path', 'val', 'socket'])); //Give the bone only if it has a value
    } else { //When writing a value
      _.set(scope, bone.path, bone.val); //Set the value
      
      if (bone.socket) { //If the call comes from a user client
        give({ path: bone.path, socket: bone.socket }) //A bone without val is used to get the field value
        bone.socket.broadcast.emit('give', { path: bone.path }); //Inform all users that they need to update this value (a bone without val indicates the client should ask for a val)
      } else { //Else, the call does not come from a user client
        io.emit('give', { path: bone.path }); //Refresh the specific route
      }
    }
  }
  
  //Will give a bone without val to all connected users so that they request an update on that path (or on all paths)
  var refresh = function(paths) {
    if (_.isString(paths)) { //If paths is in fact only a single path
      //give({ path: paths }); //A bone without val is used to get the field value
      io.emit('give', { path: paths }); //Refresh the specific route
    } else if (_.isArray(paths)) {
      _.each(paths, function(path) { //For each route
        //give({ path: paths }); //A bone without val is used to get the field value
        io.emit('give', { path: path }); //Refresh the specific route
      })
    } else {
      io.emit('refresh', paths); //Refresh a specific route
    }
  }
  
  //
  //Socket.io events
  //
  
  //On new connection
  io.on('connection', function(socket) {
    console.log("New client connected. Assigned id:", socket.id)
    
    socket.on('give', function(bone) {
      bone.socket = socket;
      take(bone);
    });
  });
  
  //Module exposed functions
  return {
    assign: assign,
    give: give,
    take: take,
    refresh: refresh
  }
};