//BoyDog server-side module

'use strict';

module.exports = function(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });
  var _ = require('lodash');
  
  
  
  var word = "initial word";
  var text = "initial text";
  
  var wordLogic = {
    
  }
  var textLogic = {
    
  }
  
  var wordRev = 1;
  var textRev = 1;
  
  
  //
  //WebSocket functions and events
  //
  
  
  //Broadcast to all or to all except a specific client
  wss.broadcast = function broadcast(data, except) {
    wss.clients.forEach(function each(client) {
      if (client !== except && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };
  
  //On a new connection
  wss.on('connection', function(socket) {
    console.log("Client connected")
    
    socket.on('message', function(bone) {
      bone = JSON.parse(bone);
      console.log("message RX", bone)
      
      if (bone.__rev !== wordRev) { //Incorrect revision
        bone = { path: bone.path, val: word, __rev: wordRev };
        
        //Middleware
        
        bone = JSON.stringify(bone);
        console.log("rev incorrect, sending", bone);
        socket.send(bone);
        
        return;
      } else { //Correct revision
        word = bone.val;
        wordRev = bone.__nextrev;
        
        //Middleware
        
        
        bone = JSON.stringify(bone);
        socket.send(bone);
        wss.broadcast(JSON.stringify(["word"]), socket); //Ask
        
        console.log("broadcast ask")
      }
    })
    
    socket.on('error', function(err) {
      if (err.code !== 'ECONNRESET') throw err; //Ignore ECONNRESET, throw all else
    })
  });
  
  //Module exposed functions
  return {
    //
  }
};