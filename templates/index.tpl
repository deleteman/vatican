var Vatican = require("vatican")

//Use all default settings
var app = new Vatican()


app.dbStart(function() {
	console.log("Db connection stablished...")
} )
//Start the server
app.start()
