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
  users: {
    guest: {
      auth: {
        user: "secret",
        pass: "pass"
      },
      name: "Mr. Guest",
      email: "guest@mail.com",
      secret: "I like being a guest",
      age: 22,
      tags: ["guest", "visitor", "viewing"]
    },
    editor: {
      auth: {
        user: "secret-editor",
        pass: "pass-editor"
      },
      name: "Mr. Editor",
      email: "editor@mail.com",
      secret: "I like being an editor",
      age: 30,
      tags: ["editor", "book", "writer"]
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
  "counter": 1,
  "counterClass": "odd",
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
  __middleRW: function(data) {
    
    return data;
  },
  __get: null,
  __set: null,
  users: {
    __set: null,
    guest: {
      __get: null,
      secret: {
        __get: function(data) {
          
          console.log("secret fetch", data);
          
          return data;
        }
      }
    }
  },
  features: {
    __set: null,
    body: {
      __set: null,
      __middleW: function(data) {
        
        console.log("feat, body, middleware", data)
        
        return data;
      },
      up: {
        __set: null,
        __get: function(data) {
          
          return data;
        },
        __middleW: function(data) {
          
          console.log("feat, body, up, middleware", data)
          
          return data;
        },
        eyes: {
          __set: null
        }
      },
      down: {
        feet: {
          __get: function(data) {
            
            return data;
          },
          __set: function(data) {
            
            return data;
          }
        }
      }
    }
  },
  company: {
    __get: function(data) {
      
      console.log("data::", data)
      
      data.val = data.val.toUpperCase();
      
      return data;
    },
    __set: function(data) {
      
      data.val = data.val.toUpperCase();
      
      return data;
    }
  },
  products: {
    __get: function(data) {
      
      if (data > 0) data = data * -1;
      bd.set('products', -data);
      
      return data;
    },
    __set: function(data) {
      
      if (data > 0) {
        data = data * -1;
      }
      
      return data;
    }
  },
  counter: {
    __set: function(data) {
      
      bd.set("counterClass", ["even", "odd"][boyData.counter % 2]);
      
      return data;
    }
  },
  addTask: {
    __run: function() {
      
      //boyData.tasks.push({ toDo: "new", progress: 50 });
      
      var next = boyData.tasks.length;
      
      bd.set('tasks[' + next + '].toDo', bd.get('newTaskName'))
      bd.set('name', "namechange")
    }
  },
  appleQuantity: {
    __set: null
  },
  increaseApples: {
    __run: function() {
      
      boyData.appleQuantity++;
      //bd.forwardPropagate('features.body');
      
      //bd.set("appleQuantity", bd.get("appleQuantity") + 1)
    }
  }
}

setInterval(function() {
  bd.set("counter", boyData.counter + 1);
}, 1000);

bd.boySet(boyData, boyLogic);

//Express configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//Use application-level middleware
app.use(express.static('public'));
app.use(require('cookie-parser')("frame-ws"));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(require('express-session')({ secret: 'd22667deca36f3e333fa87f9fd8e0218', resave: true, saveUninitialized: true }));

//The landing page
app.get('/', function(req, res) {
  return res.render("index");
});

//Debug
app.get('/debug', function(req, res) {
  console.log("debug");
  
  return res.json({});
});

app.post('/boydog', function(req, res) {
  //TODO: Implement this function as a fallback if socket.io is not available
});

//Run
var defaultPort = 3090;
server.listen(process.env.PORT ? process.env.PORT : defaultPort);
console.log("Started at " + (process.env.PORT ? process.env.PORT : defaultPort));