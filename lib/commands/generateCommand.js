var _ = require("lodash"),
	fs = require("fs");

var DEFAULT_SCHEMAS_FOLDER = process.cwd() + "/schemas"

function GenerateCommand(args) {
	var self = this;
	this.view = require("../views/generateView");
	this.handlerName = args.shift();
	this.handlersFolder = null;
	this.actions = [];
	this.fields = []

	this.schemaName = _titlelize(this.handlerName)

	this.filesCreated = []

	var option = ""
	for(var i = 0; i < args.length; i++) {
		if(args[i].indexOf("-") === 0){ 
			option = args[i].toLowerCase().replace("-", "")
		} else {
			switch(option) {
				case 'a': //gather fields  
					this.fields.push(args[i])
				break;
				case 'h': //get the handlers folder
					this.handlersFolder = args[i];
				break;
				case 'm': //gather method information
					this.actions.push(args[i]);
				break;
			}
		}
	}
}

GenerateCommand.prototype.loadConfig = function(cb) {
	try {
		var config = require(process.cwd() + "/vatican-conf.json");
		cb(null, config)
	} catch(ex) {
		cb("Error loading vatican-conf.json file: " + ex);
		return;
	}
}

GenerateCommand.prototype.run = function(cb) {
	var self = this;
	var handlersFolder = this.handlersFolder;
	var config = null
	this.loadConfig(function(err, config) {
		if(err) return cb(err)
		config = config
		if( !handlersFolder ) {
			self.handlersFolder = config.handlers;
		}

		self.generateSchema(config)
			.generateModel()
			.generateHandler(cb)

	
	})
}

GenerateCommand.prototype.generateSchema = function(config) {
	var folder = config.schemasFolder ? process.cwd() + config.schemasFolder : DEFAULT_SCHEMAS_FOLDER
	if(!fs.existsSync(folder)) {
		fs.mkdirSync(folder)
	}
	var tplContent = fs.readFileSync(__dirname + "/../../templates/newSchema.tpl").toString()
	tplContent = tplContent.replace("[[NAME]]", "'" + this.schemaName + "'")
	var attrs = _.map(this.fields , function(attr) {
		var parts = attr.split(":")
		return parts[0] + ': ' + (parts[1] ? _titlelize(parts[1]) : "String")
	})
	tplContent = tplContent.replace("[[FIELDS]]", attrs.join(","))
	var filepath = folder + "/" + this.schemaName + ".js"
	this.filesCreated.push(filepath)
	fs.writeFileSync(filepath, tplContent)
	return this
}

GenerateCommand.prototype.generateModel = function (){
	return this
}
GenerateCommand.prototype.generateHandler = function(cb) {
	var handlerFuncName = _titlelize(this.handlerName);
	var content = "module.exports = " + handlerFuncName + ";\n";
	content += "function " + handlerFuncName + "() {}\n";
	var self = this

	_(this.actions).each(function(act) {
		var parts = act.split(":")
		content += "@endpoint (url: /" + _toUrlFormat(self.handlerName) + " method: " + parts[1] + ")\n";
		content += handlerFuncName + ".prototype." + parts[0] + " = function(req, res, next) {}\n\n";
	})

	fs.writeFile(self.handlersFolder + "/" + self.handlerName + ".js", content, function(err) {
		if(err) {
			var msg = "Error saving handler file: " + err;
			cb(msg);
		}
	});

	var filepath = self.handlersFolder + "/" + self.handlerName + ".js"
	this.filesCreated.push(filepath)

	cb(null, this.filesCreated);
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