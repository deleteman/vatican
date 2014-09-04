var colors = require("colors"),
	_ = require("lodash");

module.exports = function(paths) {
	return {
		render: function() {
			console.log("New project started:".green);
			_( paths ).each(function(p) {
				console.log(("Creating " + p + " ...").green)
			})
			console.log("\n Project files created, now just follow these steps: ")
			console.log("1- cd into your new project folder")
			console.log("2- npm install")
			console.log("3- node index.js")
		}
	}
}
