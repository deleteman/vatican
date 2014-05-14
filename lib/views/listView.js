var colors = require("colors"),
	_ = require("lodash");

module.exports = function(paths) {
	return {
		render: function() {
			console.log("L¡st of routes found:".green);
			_( paths ).each(function(p) {
				console.log(_printMethod(p.method) + (p.url).yellow + " -> " + p.handlerPath + "::" + (p.action).blue);
			})
		}
	}
}

function _printMethod(m) {
	var colors = {
		"GET": "green",
		"PUT": "yellow",
		"DELETE": "red",
		"POST": "grey"
	}
	var method = m.toUpperCase();
	return "[" + (method)[colors[method]] + "] ";
}