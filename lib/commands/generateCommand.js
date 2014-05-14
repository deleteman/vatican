var _ = require("lodash"),
	fs = require("fs");

function GenerateCommand(args) {
	this.view = require("../views/generateView");
	this.handlerName = args[0];
	this.actions = _( args[1].split(",") ).map(function(a) { return a.trim(); });
}

GenerateCommand.prototype.run = function(cb) {
	var self = this;
	try {
		var config = require(process.cwd() + "/vatican-conf.json");
	} catch(ex) {
		cb("Error loading vatican-conf.json file: " + ex);
		return;
	}

	var handlerFuncName = _titlelize(this.handlerName);
	var content = "module.exports = " + handlerFuncName + ";\n";
	content += "function " + handlerFuncName + "() {}\n";

	_(this.actions).each(function(act) {
		content += "@endpoint (url: /" + _toUrlFormat(self.handlerName) + " method: ??)\n";
		content += handlerFuncName + ".prototype." + act + " = function(req, res) {}\n\n";
	})

	fs.writeFile(config.handlers + "/" + self.handlerName + ".js", content, function(err) {
		if(err) {
			var msg = "Error saving handler file: " + err;
			cb(msg);
		}
	})
	cb(null, config.handlers + "/" + self.handlerName + ".js");
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