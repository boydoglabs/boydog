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

var foo = {
	"index": 0,
	"guid": "2bb9ad64-8b39-4a62-bbf6-b30c7fb16010",
	"isActive": false,
	"balance": "$1,300.59",
	"picture": "http://placehold.it/32x32",
	"age": 27,
	"eyeColor": "brown",
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

//Functions
/*var setDog = _.debounce(function(attr, val) {
	io.emit('set-dog', { attr: attr, val: val });
}, 100);*/

//API get
app.get('/', function(req, res) {
	
	return res.render("index");
});

app.post('/get', function(req, res) {
	var attr = req.body.attr;
	
	console.log(attr);
	
	var msg = _.get(foo, attr);
	
	return res.json({ msg: msg });
});

//API post
/*app.post('/set', function(req, res) {
	var attr = req.body.attr,
		val = req.body.val;
	
	_.set(foo, attr, val);
	console.log(_.get(foo, attr));
	
	setDog(attr, val);
	
	return res.json({ msg: req.body.val });
});*/

//Socket.io
io.on('connection', function(socket) {
	socket.emit('news', { hello: 'world' });

	socket.on('set-boy', function(data) {
		socket.emit('set-dog', { attr: data.attr, val: data.val });
		
		_.set(foo, data.attr, data.val);
		
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