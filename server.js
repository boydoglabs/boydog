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
        },
        "down": {
          "feet": 2
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
    },
    "_w": function() {
    },
    "features": {
      "body": {
        "up": {
          "color": {
            "_r": function(data) {
            },
            "_w": function(data) {
            }
          }
        },
        "down": {
          "feet": {
            "_r": function(data) {
              
              return data;
            },
            "_w": function(data) {
              
              return data;
            }
          }
        }
      }
    },
    "name": {
      "_r": function(data) {
        
        return data.toUpperCase();
      },
      "_w": function(data) {
        
        return data.toUpperCase();
      }
    },
    "age": {
      "_r": function(data) {
        
        return data;
      },
      "_w": function(data) {
        
        if (data > 0) {
          data = data * -1;
        }
        
        return data;
      }
    },
    "addTask": {
      "_r": function() {
      },
      "_w": function() {
      }
    }
  }
  
  //var socket;
  
  var read = function(attr) {
    var mask = _.get(boyLogic, attr);
    var val;
    
    console.log("r attr", attr, "mm", mask)
    
    if (_.isUndefined(mask)) {
      val = _.get(boyData, attr);
    } else {
      if (_.isUndefined(mask["_r"])) {
        val = _.get(boyData, attr);
      } else {
        val = mask["_r"](_.get(boyData, attr));
      }
    }
    
    console.log("emit", attr, val)
    
    try {
      io.emit('dog-val', { attr: attr, val: val }); //Get the value using mask
    } catch(e) { } //Don't care if value is not emitted to users
    
    return val;
  };
  
  var write = function(attr, val) {
    var mask = _.get(boyLogic, attr);
    
    if (_.isUndefined(mask)) {
      _.set(boyData, attr, val);  //Set the value without mask
    } else {
      if (!_.isUndefined(mask["_w"])) {
        val = mask["_w"](val); //Redefine data.set here because it is used afterwards, do not optimize into the the next line
      }
      
      _.set(boyData, attr, val);  //Set the value with a mask
    }
    
    //Propagation of current field to all clients
    try {
        io.emit('dog-val', { attr: attr, val: val }); //Propagate the changing field to all clients *must happen as soon as possible*
    } catch(e) { } //Don't care if value is not emitted to users
    
    //Backpropagation of related fields to all clients
    var path = _.toPath(attr);
    var relatedPaths = [path[0]];
    var str = path[0];
    var i;
    
    for (i = 1; i < path.length - 1; i++) {
      str += "['" + path[i] + "']";
      relatedPaths.push(str);
    }
    for (i = relatedPaths.length - 1; i >= 0; i--) {
      //socket.broadcast.emit('dog-val', { attr: relatedPaths[i], val: _.get(boyData, relatedPaths[i]) }); //Propagate related fields other clients (used for sockets)
      console.log("bprop to", relatedPaths[i])
      io.emit('dog-val', { attr: relatedPaths[i], val: _.get(boyData, relatedPaths[i]) }); //Propagate related fields to myself
    }
    
    //Propagation of the main container
    //io.broadcast.emit('dog-val', { attr: '.', val: boyData }); //Propagate related fields other clients (used for sockets)
    io.emit('dog-val', { attr: '.', val: boyData }); //Propagate related fields to myself
    
    return 1;
  }
  
  //Socket.io
  io.on('connection', function(socket) {
    console.log("connection")
    
    socket.on('boy-val', function(data) {
      if (!_.isUndefined(data.set)) {
        
        write(data.attr, data.set);
      } else if (!_.isUndefined(data.get)) {
        read(data.attr);
      } else {
        console.log('undefined boy-val')
      }
    });
  });
  
  return {
    boyData: boyData,
    boyLogic: boyLogic,
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
  return res.render("index");
});
app.get('/landing', function(req, res) {
  return res.render("landing");
});
app.get('/elements', function(req, res) {
  return res.render("elements");
});
app.get('/generic', function(req, res) {
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