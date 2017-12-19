require('dotenv').config();

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
  io = require('socket.io')(server);

//Express configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//Use application-level middleware
app.use(express.static('public'));
app.use(require('cookie-parser')("frame-ws"));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(require('express-session')({ secret: 'd22667deca36f3e333fa87f9fd8e0218', resave: true, saveUninitialized: true }));

var boyData = {
  "index": 0,
  "guid": "2bb9ad64-8b39-4a62-bbf6-b30c7fb16010",
  "isActive": false,
  "balance": "$1,300.59",
  "picture": "http://placehold.it/32x32",
  "age": 27,
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
  "friends": {
    "add": function() {
      console.log("boyLogic friends add");
    }
  }
}

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


app.post('/get', function(req, res) {
  var attr = req.body.attr;
  
  console.log(attr);
  
  if (attr === ".") return res.json({ msg: boyData });
  
  var msg = _.get(boyData, attr);
  
  return res.json({ msg: msg });
});

//Socket.io
io.on('connection', function(socket) {
  socket.emit('news', { hello: 'world' });

  socket.on('set-boy', function(data) {
    socket.broadcast.emit('dog-val', { attr: data.attr, val: data.val }); //Propagate the changing field (must happen immediately)
    _.set(boyData, data.attr, data.val);  //Set the changing field (must happend just before the broadcast)
    
    //Backpropagate related fields
    
    var path = _.toPath(data.attr);
    //path.pop();
    var relatedPaths = [path[0]];
    var str = path[0];
    
    for (i = 1; i < path.length - 1; i++) {
      console.log(path[i]);
      str += '["' + path[i] + '"]';
      relatedPaths.push(str);
    }
    for (i = relatedPaths.length - 1; i >= 0; i--) {
      console.log("debug relatedPaths", relatedPaths[i], "is", _.get(boyData, relatedPaths[i]));
      socket.broadcast.emit('dog-val', { attr: relatedPaths[i], val: _.get(boyData, relatedPaths[i]) }); //Propagate related fields other clients
      socket.emit('dog-val', { attr: relatedPaths[i], val: _.get(boyData, relatedPaths[i]) }); //Propagate related fields to myself
    }
    
    
    
    
    //Propagate the main container
    console.log("propagate main container")
    socket.broadcast.emit('dog-val', { attr: '.', val: boyData }); //Propagate related fields other clients
    socket.emit('dog-val', { attr: '.', val: boyData }); //Propagate related fields to myself
    
    console.log("set-boy", data);
  });

  socket.on('join', function(data) {
    console.log("join", data);
  });
  
  console.log("connection");
});


//Run
server.listen(process.env.PORT);
console.log("Started at " + process.env.PORT);