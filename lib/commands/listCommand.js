var	handlerParser  = require("../handlerParser"),
	_ = require("lodash"),
	colors = require("colors");

function listCommand(args) {
	this.view = require("../views/listView.js");
	this.handlersFolder = null;
	if( args[0] === "-h") {
		this.handlersFolder = args[1];
	}
}

listCommand.prototype.run = function(cb) {
	var dir = this.handlersFolder;

	if(!dir) {
		try {
			var config = require(process.cwd() + "/vatican-conf.json");
			dir = config.handlers;
		} catch(ex) {
			cb("Error loading vatican-conf.json file: " + ex);
			return;
		}
	}

	handlerParser.parse(dir, function(err, paths) {
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