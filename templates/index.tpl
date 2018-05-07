var Vatican = require("vatican")

//Use all default settings
var app = new Vatican()

app.on('READY', (err, paths) => {
	console.log("Vatican is ready...");
	//your code goes here...
})

app.start(function() {
	console.log("VaticanJS is up and running...")
	
} )
