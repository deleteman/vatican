var colors = require("colors"),
	_ = require("lodash");

module.exports = function(paths) {
	return {
		render: function() {
			console.log("New project started:".green);
			_( paths ).each(function(p) {
				console.log(("Creating " + p + " ...").green)
			})
		}
	}
}
