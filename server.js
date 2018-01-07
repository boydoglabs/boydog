'use strict';

require('dotenv').config();

//Constants
const dbPath = './db/';

//Vars
var fs = require('fs'),
  path = require('path'),
  express = require('express'),
  ejs = require('ejs');

var app = express(),
  server = require('http').createServer(app),
  bd = require('boydog-boy')(server);

var boyData = {
  "users": {
    "guest-1": {
      "auth": {
        "user": "secret",
        "pass": "pass"
      },
      "name": "Mr. Guest",
      "age": 22,
      "tags": ["guest", "visitor", "viewing"]
    },
    "guest-2": {
      "auth": {
        "user": "secret2",
        "pass": "pass2"
      },
      "name": "Mr. Guest 2",
      "age": 25,
      "tags": ["guest", "secondary", "temporal"]
    },
    "editor": {
      "auth": {
        "user": "secret-editor",
        "pass": "pass-editor"
      },
      "name": "Mr. Editor",
      "age": 30,
      "tags": ["editor", "book", "writer"]
    }
  },
  "name": "Hyde Malone",
  "email": "hydemalone@mail.com",
  "age": 25,
  "company": "OMATOM",
  "products": 500,
  //"isActive": false, //TODO
  //"balance": "$1,300.59", //TODO
  //"picture": "http://placehold.it/32x32", //TODO
  "features": {
    "body": {
      "up": {
        "eyes": [{
          "color": "black"
        },{
          "color": "green"
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
  "appleQuantity": 7,
  "newTaskName": "new task",
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
}

var boyLogic = {
  "_middle-rw": function(data) {
    
    console.log("LOG TYPE", data);
    
    return data;
  },
  "users": {
    "_w": null
  },
  "features": {
    "_w": null,
    "body": {
      "_w": null,
      "up": {
        "_w": null,
        "eyes": {
          "_w": null
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
  "company": {
    "_r": function(data) {
      
      return data.toUpperCase();
    },
    "_w": function(data) {
      
      return data.toUpperCase();
    }
  },
  "products": {
    "_r": function(data) {
      
      if (data > 0) data = data * -1;
      bd.write('products', -data);
      
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
    "_a": function() {
      
      //boyData.tasks.push({ toDo: "new", progress: 50 });
      
      var next = boyData.tasks.length;
      
      bd.write('tasks[' + next + '].toDo', bd.read('newTaskName'))
      bd.write('name', "namechange")
    }
  },
  "increaseApples": {
    "_a": function() {
      
      var t = bd.write("appleQuantity", bd.read("appleQuantity") + 1)
      
      console.log("createNewTask action", t);
    }
  }
}

bd.setDataLogic(boyData, boyLogic);

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
app.get('/example', function(req, res) {
  return res.render("example");
});

//Debug
app.get('/debug', function(req, res) {
  console.log(boyData)
  boyData.about = "CHANGING DATA";
  
  console.log(boyData)
  
  return res.json({ data: true });
});

app.post('/get', function(req, res) {
  var attr = req.body.attr;
  
  if (attr === ".") return res.json({ msg: boyData });
  var msg = _.get(boyData, attr);
  
  return res.json({ msg: msg });
});

//Run
server.listen(process.env.PORT ? process.env.PORT : 3090);
console.log("Started at " + (process.env.PORT ? process.env.PORT : 3090));