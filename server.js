'use strict';

require('dotenv').config();

//Module dummy definition
var boydog = function(server) {
  'use strict';
  
  var io = require('socket.io')(server);
  
  var boyData = {
    "index": 0,
    "guid": "2bb9ad64-8b39-4a62-bbf6-b30c7fb16010",
    "isActive": false,
    "balance": "$1,300.59",
    "picture": "http://placehold.it/32x32",
    "age": -27,
    "features": {
      "body": {
        "up": {
          "eyes": [{
            "color": "green"
          },{
            "color": "blue"
          }]
        }
      },
      "mind": {
        "iq": 120,
        "stamina": 90
      }
    },
    "name": "Hyde Malone",
    "gender": "male",
    "company": "OMATOM",
    "email": "hydemalone@omatom.com",
    "phone": "+1 (816) 437-3238",
    "users": [
      {
        "id": 555,
        "name": "first user",
        "age" : 20,
        "email": "first@mail.com"
      },
      {
        "id": 456,
        "name": "second user",
        "age" : 15,
        "email": "second@mail.com"
      },
      {
        "id": 900,
        "name": "third3 user",
        "age" : 23,
        "email": "third3@mail.com"
      }
    ],
    "tasks" : [{
      "toDo": "do ABC",
      "progress": 30,
      "doer": "first@mail.com",
      "done": true
    }, {
      "toDo": "do QWE",
      "progress": 50,
      "doer": "zxcv@mail.com",
      "done": true
    }, {
      "toDo": "do QAX",
      "progress": 80,
      "doer": "qwe@mail.com",
      "done": true
    }],
    "addTask": 7,
    "address": "462 Llama Court, Sattley, American Samoa, 8570",
    "about": "Exercitation enim elit incididunt exercitation velit veniam aliqua ullamco sit est. In incididunt ad esse officia aliqua. Non cupidatat voluptate amet nostrud incididunt aliqua non sint id reprehenderit amet cillum sit. Cupidatat exercitation laborum commodo elit duis irure irure occaecat sit cillum voluptate nostrud. Laboris adipisicing exercitation dolore adipisicing. Adipisicing aliquip mollit Lorem aute amet aute magna id consequat nulla Lorem. Reprehenderit consectetur labore velit magna.\r\nLabore nostrud cupidatat Lorem elit non commodo eu. Occaecat nulla elit consequat culpa ea dolor culpa anim minim consectetur officia non. Ea ullamco sunt labore minim sint excepteur qui id excepteur officia sunt elit ad Lorem.\r\nOccaecat excepteur ipsum deserunt ut cupidatat reprehenderit aute et voluptate tempor. Anim labore consequat aliquip commodo mollit aliqua mollit ullamco duis est aute occaecat. Ut sit est officia consectetur pariatur qui ut officia pariatur in cupidatat et aliquip. Amet reprehenderit anim duis nostrud culpa tempor in enim id ex quis quis cupidatat non. Qui ea commodo ut aliquip proident id fugiat pariatur sit.\r\n",
    "registered": "2017-02-12T02:41:43 +06:00",
    "latitude": 52.830264,
    "longitude": 130.016097,
    "colors": {
      "red": 135,
      "blue": 400,
      "skyBLUE": 500
    },
    "tags": [
      "fugiat",
      "sunt",
      "mollit",
      "sint",
      "mollit",
      "est",
      "occaecat"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Patton Monroe"
      },
      {
        "id": 1,
        "name": "Cheri Howe"
      },
      {
        "id": 2,
        "name": "Cortez Cotton"
      }
    ],
    "greeting": "Hello, Hyde Malone! You have 1 unread messages.",
    "favoriteFruit": "apple"
  };

  var boyLogic = {
    "_r": function() {
      console.log("all _r");
    },
    "_w": function() {
      console.log("all _w");
    },
    "name": {
      "_r": function(data) {
        console.log("name _r");
        
        return data.toUpperCase();
      },
      "_w": function(data) {
        console.log("name _w");
        
        return data.toUpperCase();
      }
    },
    "age": {
      "_r": function(data) {
        console.log("age _r");
        
        return data;
      },
      "_w": function(data) {
        console.log("age _w", data);
        
        if (data > 0) {
          data = data * -1;
        }
        
        return data;
      }
    },
    "addTask": {
      "_r": function() {
        console.log("console _r");
      },
      "_w": function() {
        console.log("console _w");
      }
    }
  }
  
  var socket;
  
  var read = function(attr) {
    var mask = _.get(boyLogic, attr);
    var val;
    
    if (_.isUndefined(mask)) {
      val = _.get(boyData, attr);
      try {
        socket.emit('dog-val', { attr: attr, val: val }); //Get the value without mask
      } catch(e) { } //Don't care if value is not emitted to users
    } else {
      val = mask["_r"](_.get(boyData, attr));
      try {
        socket.emit('dog-val', { attr: attr, val: val }); //Get the value using mask
      } catch(e) { } //Don't care if value is not emitted to users
    }
    
    return val;
  };
  
  var write = function(attr, val) {
    _.set(boyData, attr, (_.get(boyLogic, attr))["_w"](val));
    
    return 1;
  }
  
  //Socket.io
  io.on('connection', function(_socket) {
    socket = _socket;
    
    socket.on('boy-val', function(data) {
      if (!_.isUndefined(data.set)) {
        console.log('should SET', data);
        
        //Execute boy set logic
        var mask = _.get(boyLogic, data.attr);
        if (_.isUndefined(mask)) {
          _.set(boyData, data.attr, data.set);  //Set the value without mask
        } else {
          data.set = mask["_w"](data.set); //Redefine data.set here because it is used afterwards, do not optimize into the the next line
          _.set(boyData, data.attr, data.set);  //Set the value with a mask
        }
        
        //Propagate to other users
        socket.broadcast.emit('dog-val', { attr: data.attr, val: data.set }); //Propagate the changing field (must happen immediately)
        
        //Backpropagate related fields
        var path = _.toPath(data.attr);
        var relatedPaths = [path[0]];
        var str = path[0];
        var i;
        
        for (i = 1; i < path.length - 1; i++) {
          str += '["' + path[i] + '"]';
          relatedPaths.push(str);
        }
        for (i = relatedPaths.length - 1; i >= 0; i--) {
          socket.broadcast.emit('dog-val', { attr: relatedPaths[i], val: _.get(boyData, relatedPaths[i]) }); //Propagate related fields other clients
          socket.emit('dog-val', { attr: relatedPaths[i], val: _.get(boyData, relatedPaths[i]) }); //Propagate related fields to myself
        }
        
        //Propagate the main container
        socket.broadcast.emit('dog-val', { attr: '.', val: boyData }); //Propagate related fields other clients
        socket.emit('dog-val', { attr: '.', val: boyData }); //Propagate related fields to myself
      } else if (!_.isUndefined(data.get) && data.get === true) { //If data.set === 0 then GET
        console.log('should GET', data);
        
        read(data.attr);
      } else {
        console.log('undefined boy-val')
      }
    });
    
    console.log("io on connection");
  });
  
  console.log("constructor");
  
  return {
    boyData: boyData,
    boyLogic: boyLogic,
    socket: socket,
    read: read,
    write: write
  }
}

//Constants
const dbPath = './db/';

//Vars
var fs = require('fs'),
  path = require('path'),
  express = require('express'),
  ejs = require('ejs'),
  _ = require('lodash'),
  app = express(),
  server = require('http').createServer(app),
  boydog = boydog(server);
  
  boydog.settings
  
//Express configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//Use application-level middleware
app.use(express.static('public'));
app.use(require('cookie-parser')("frame-ws"));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(require('express-session')({ secret: 'd22667deca36f3e333fa87f9fd8e0218', resave: true, saveUninitialized: true }));

//Temporal add item to dog-each
var tempAdd = function() {
  boyData.users.push({
    "toDo": "NEW EL",
    "progress": 3,
    "doer": "NEW@mail.com",
    "done": false
  });
}

//API get
app.get('/', function(req, res) {
  
  console.log(boydog.boyData);
  
  return res.render("index");
});
app.get('/landing', function(req, res) {
  
  console.log(boydog.boyData);
  
  return res.render("landing");
});
app.get('/elements', function(req, res) {
  
  console.log(boydog.boyData);
  
  return res.render("elements");
});
app.get('/generic', function(req, res) {
  
  console.log(boydog.boyData);
  
  return res.render("generic");
});

//Debug
app.get('/debug', function(req, res) {
  
  var r = boydog.read('picture');
  var w = boydog.write('age', 999);
  
  return res.json({ r: r, w: w });
});

app.post('/get', function(req, res) {
  var attr = req.body.attr;
  
  if (attr === ".") return res.json({ msg: boyData });
  var msg = _.get(boyData, attr);
  
  return res.json({ msg: msg });
});

//Run
server.listen(process.env.PORT);
console.log("Started at " + process.env.PORT);