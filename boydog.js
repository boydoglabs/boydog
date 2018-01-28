//BoyDog server-side module

'use strict';

module.exports = function(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });
  var _ = require('lodash');
  
  wss.on('connection', function connection(socket) {
    
    //Socket events
    socket.on('message', function incoming(bone) {
      //
    })
    
    socket.on('error', function (err) {
      if (err.code !== 'ECONNRESET') throw err; //Ignore ECONNRESET, throw all else
    })
  });
  
  //Module exposed functions
  return {
    //
  }
};