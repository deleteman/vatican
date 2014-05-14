var	handlerParser  = require("../handlerParser"),
	_ = require("lodash"),
	colors = require("colors");

function listCommand() {
	this.view = require("../views/listView.js");
}

listCommand.prototype.run = function(cb) {

	handlerParser.parse(function(err, paths) {
		if(err) {
			logger.error("Error: " + err);
		} else {
			if(paths && Array.isArray(paths)) {
				cb(null, paths);
			} else {
				cb("No paths found");
			}
		}
	});
}

module.exports = listCommand;