var commands = require("./commands");

var MAPPINGS = {
	list: commands.list,
	g: commands.generate,
	generate: commands.generate,
	"new": commands.newProject
}

module.exports.getCommand = function(args) {

	var cmd = args[0];
	if(!MAPPINGS[cmd]) {
		return new MAPPINGS.default(args);
	} else {
		return new MAPPINGS[cmd](args.slice(1));
	}
};