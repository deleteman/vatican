var _ = require("lodash"),
	fs = require("fs");

var DEFAULT_PORT = 8753;
var DEFAULT_HANDLERS_FOLDER = "./handlers";

function NewCommand(args) {
	this.view = require("../views/newView");
	this.projectName = args[0];
	this.projectFolder = null;
	this.params = args.slice(1);

	this.port = DEFAULT_PORT;
	this.handlersFolder = DEFAULT_HANDLERS_FOLDER;

	this.parseParams();

}

NewCommand.prototype.parseParams = function() {
	var self = this;
	_( this.params ).each(function(p, idx) {
		switch(p.toLowerCase()) {
			case '-p': 
				self.port = self.params[idx + 1];
			break;
			case '-h':
				self.handlersFolder = self.params[idx + 1];
			break;
		}
	})
}

NewCommand.prototype.run = function(cb) {
	var created = [];
	var self = this;
	this.createProjectFolder(function(err, path) {
		if(!err) {
			created.push(path);
			self.createHandlersFolder(function(err, hpath) {
				if(!err) {
					created.push(hpath)
					self.createConfigFile(function(err, configPath) {
						if(!err) {
							created.push(configPath);
							self.createIndexAndPackageFile(function(err, paths) {
								if(!err) {
									created = _.union(created, paths)
									cb(null, created);
								} else {
									cb(err)
								}
							})
						} else {
							cb(err);
						}
					})
				} else {
					cb(err);
				}
			})
		} else {
			cb(err);
		}
	})
}

NewCommand.prototype.createIndexAndPackageFile = function(cb) {
	var indexFilePath = __dirname + "/../../templates/index.tpl",
		packageFilePath = __dirname + "/../../templates/package.tpl",
		self = this

	fs.readFile(indexFilePath, function(err, content) {
		if(err) return cb(err)
		fs.writeFile(self.projectFolder + "/index.js", content, createPackage)
	})	


	function createPackage(err) {
		if(err) return cb(err)
		fs.readFile(packageFilePath, function(err, content) {
			if(err) return cb(err)
			content = content.toString().replace("[APP_NAME]", self.projectName)
			fs.writeFile(self.projectFolder + "/package.json", content, function() {
				cb(null, [
					self.projectFolder + "/index.js",
					self.projectFolder + "/package.json"
					])
			})
		})
	}
}

NewCommand.prototype.createProjectFolder = function(cb) {
	var newFolder = process.cwd() + "/" + this.projectName;
	var self = this;
	fs.mkdir(newFolder, function(err) {
		if(err) {
			cb("Error creating project folder '" + newFolder + "': " + err);
		} else {
			self.projectFolder = newFolder;
			cb(null,newFolder);
		}
	})
}

NewCommand.prototype.createHandlersFolder = function(cb) {
	var newFolder = this.projectFolder + "/" + this.handlersFolder;
	var self = this;
	fs.mkdir(newFolder, function(err) {
		if(err) {
			cb("Error creating handlers folder '" + newFolder + "': " + err);
		} else {
			cb(null,newFolder);
		}
	})
}

NewCommand.prototype.createConfigFile = function(cb) {
	var newFile = this.projectFolder + "/vatican-conf.json";
	var self = this;

	var config = {
		port: this.port,
		handlers: this.handlersFolder
	};

	fs.writeFile(newFile, JSON.stringify(config), function(err) {
		if(err) {
			cb("Error creating config file '" + newFile + "': " + err);
		} else {
			cb(null,newFile);
		}
	})
}

module.exports = NewCommand;