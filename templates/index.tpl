var Vatican = require("vatican")

//Use all default settings
var app = new Vatican()

app.on('READY', (err, paths) => {
	console.log("Vatican is ready...");
	//your code goes here...
})

app.dbStart(function() {
	console.log("Db connection stablished...")

	//Start the server
	app.start()
} )
