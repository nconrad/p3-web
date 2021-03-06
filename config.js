var nconf = require('nconf');

var defaults =  {
	"http_port": 3000,
	"authorizationURL": "http://user.patric.local:3002/login",
	"application_id": "patric3",
	"p3_clientId": "patric3",
	"p3_clientSecret": "patric3",
	"solr": {
		"url": "http://localhost:8983/solr"
	},
	"redis": {
		"host": "127.0.0.1",
		"port": 6379,
		"prefix": "",
		"db": 1,
		"pass":""
	},

	"cookieKey": "JSESSIONID",
	"cookieDomain": ".patric.local",

	"sessionTTL": 2628000000,

	workspaceServiceURL:"",
	appServiceURL: "",
	dataURL: "",

	enableDevAuth: false,
	devAuthorizationToken: "",
	devUser: false,
        enableDevTools: false
}

module.exports = nconf.argv().env().file("./p3-web.conf").defaults(defaults);


