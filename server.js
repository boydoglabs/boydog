require('dotenv').config();

//Constants
const dbPath = './db/';

//Vars
var fs = require('fs'),
	path = require('path'), 
	express = require('express'),
	ejs = require('ejs'),
	app = express(),
	mkdirp = require('mkdirp'),
	_ = require('lodash');

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
	"_id": "5a20977f783619b3d7b8991a",
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
var _jsonToFson = function(json, keyPath, cb) {
	var msg = true;
	
	_.forOwn(json, function(v, k) {
		console.log(k, _.isObject(v));
		
		if (_.isObject(v)) {
			//Create dir
			
			var dir = path.join(dbPath, keyPath, k);
			console.log(dir);
			
			if (!fs.existsSync(dir)) {
				mkdirp(dir);
				console.log("dir created")
			}
		} else {
			//Create file
			
			
		}
		
		
		
		
		
	})
	
	return cb(msg);
}

var _fsonToJson = function(path, cb) {
	var json;
	
	//Get json
	
	return cb(json);
}

//Pages
app.get('/', function(req, res) {
	_jsonToFson(foo, 'foo', function(msg) {
		
		
		return res.json(msg);
	});
});

//Run
app.listen(process.env.PORT);
console.log("Started at " + process.env.PORT);