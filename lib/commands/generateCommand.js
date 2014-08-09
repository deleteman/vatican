var _ = require("lodash"),
	fs = require("fs");

function GenerateCommand(args) {
	var self = this;
	this.view = require("../views/generateView");
	this.handlerName = args.shift();
	this.handlersFolder = null;
	this.actions = [];

	for(var i = 0; i < args.length; i++) {
		var isOption = args[i].toLowerCase() == "-h";
		if( !isOption ) {
			this.actions.push(args[i]);
		} else {
			this.handlersFolder = args[i + 1];
			i++;
		}
	}
}

GenerateCommand.prototype.run = function(cb) {
	var self = this;
	var handlersFolder = this.handlersFolder;
	if( !handlersFolder ) {
		try {
			var config = require(process.cwd() + "/vatican-conf.json");
			handlersFolder = config.handlers;
		} catch(ex) {
			cb("Error loading vatican-conf.json file: " + ex);
			return;
		}
	}

	var handlerFuncName = _titlelize(this.handlerName);
	var content = "module.exports = " + handlerFuncName + ";\n";
	content += "function " + handlerFuncName + "() {}\n";

	_(this.actions).each(function(act) {
		content += "@endpoint (url: /" + _toUrlFormat(self.handlerName) + " method: ??)\n";
		content += handlerFuncName + ".prototype." + act + " = function(req, res, next) {}\n\n";
	})

	fs.writeFile(handlersFolder + "/" + self.handlerName + ".js", content, function(err) {
		if(err) {
			var msg = "Error saving handler file: " + err;
			cb(msg);
		}
	})
	cb(null, handlersFolder + "/" + self.handlerName + ".js");
}

function _titlelize (txt) {
	var parts = txt.split(" ");
	return _( parts ).map(function(t) {
		return t.charAt(0).toUpperCase() + t.slice(1);
	}).join("");
}

function _toUrlFormat (txt) { 
	var parts = txt.split(" ");
	return _( parts ).map(function(t) {
		return t.toLowerCase();
	}).join("_");
}

module.exports = GenerateCommand;