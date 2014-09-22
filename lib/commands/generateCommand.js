var _ = require("lodash"),
	path = require("path"),
	logger = require("../logger"),
	fs = require("fs");

var DEFAULT_SCHEMAS_FOLDER = process.cwd() + "/schemas"
var DEFAULT_CRUD_ACTIONS = [
	'create:post',
	'update:put',
	'list:get',
	'remove:delete'
]

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
		if(config.schemasFolder)
			self.schemasFolder = process.cwd() + config.schemasFolder
		else 
			self.schemasFolder = DEFAULT_SCHEMAS_FOLDER

		self.generateSchema()
			.generateHandler(cb)

	
	})
}

GenerateCommand.prototype.generateSchema = function() {
	var folder = this.schemasFolder
	if(!fs.existsSync(folder)) {
		fs.mkdirSync(folder)
	}
	var self = this
	var tplContent = fs.readFileSync(__dirname + "/../../templates/newSchema.tpl").toString()
	tplContent = tplContent.replace("[[NAME]]", "'" + this.schemaName + "'")
	var attrs = _.map(this.fields , function(attr) {
		var parts = attr.split(":")
		return parts[0] + ': ' + self.parseType(parts[1])
	})
	tplContent = tplContent.replace("[[FIELDS]]", attrs.join(",\n\r\t"))
	var filepath = folder + "/" + this.schemaName + ".js"
	this.filesCreated.push(filepath)
	fs.writeFileSync(filepath, tplContent)
	return this
}

GenerateCommand.prototype.parseType = function(type) {
	if(!type) return 'String'
	var commonTypes = {
		text: 'String',
		string: 'String',
		bool: 'Boolean',
		'boolean': 'Boolean',
		string: 'String',
		number: 'Number',
		numeric: 'Number',
		integer: 'Number',
		'double': 'Number'
	}
	type = type.toLowerCase()
	if(commonTypes[type]) {
		return commonTypes[type]
	} else {
		var matches = type.match(/\[([a-zA-Z]+)\]/)
		if(matches) {
			type = this.parseType(matches[1])
			return "[" + type + "]"
		} else {
			return "{ type: Schema.Types.ObjectId, ref: '" + _titlelize(type) + "' }"
		}
	}
}

GenerateCommand.prototype.generateHandler = function(cb) {

	var relativeRequirePath = path.relative(this.handlersFolder, this.schemasFolder)

	var handlerFuncName = _titlelize(this.handlerName) + "Hdlr";
	var content = ''
	content += "\n\nmodule.exports = " + handlerFuncName + ";\n";
	content += "function " + handlerFuncName + "(_model) { this.model = _model }\n";
	var self = this

	if(this.actions.length === 0) {
		this.actions = DEFAULT_CRUD_ACTIONS
	}

	_(this.actions).each(function(act) {
		var parts = act.split(":")
		content += "@endpoint (url: /" + _toUrlFormat(self.handlerName) + " method: " + parts[1] + ")\n";
		content += handlerFuncName + ".prototype." + parts[0] + " = function(req, res, next) { " + self.getMethodCode(parts[0]) + "}\n\n";
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

GenerateCommand.prototype.getMethodCode = function(methodName) {
	var action = null

	if(methodName.match(/(new|save|create)/i)) {
		action = 'create'
	}
	if(methodName.match(/(update)/i)) {
		action = 'update'
	}

	if(methodName.match(/(delete|remove|erase|kill)/i)) {
		action = 'delete'
	}

	if(methodName.match(/(list|search|find|index)/i)) {
		action = 'list'
	}

	if(action === null) {
		logger.info("Don't know how to auto-generate code for method: " + methodName)	
		return ''
	}

	var tplContent = fs.readFileSync(__dirname + "/../../templates/" + action + "Method.tpl").toString()
	tplContent = tplContent.replace("[[SCHEMA]]", this.schemaName)
	return tplContent
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