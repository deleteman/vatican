var logger = require("./logger"), 
	fs = require("fs"),
	_ = require("lodash");

var CONFIG_FILE_PATH = process.cwd() + "/vatican-conf.json";
module.exports = {

	parse: function(dir, cb) {
		var paths = [];
	    fs.readdir(dir, function(err, files) {

	        if(err) {
	            logger.error("Error reading folder: " + dir);
	            cb("Error reading folder: " + dir);
	        } else {
	            var fpath = "";
	            _(files).where(function(f) { return f.match(/\.js$/i); }).forEach(function(fname) {
	                fpath = dir + "/" + fname;
	                logger.info("Openning file: " + fpath);
	                var content = fs.readFileSync(fpath).toString();
	                var regExp = /@endpoint ?\((url:.+) (method: (?:get|put|post)) ?(name:.+)?\).*\n(.*)\(/gim;
	                while( (matches = regExp.exec(content)) !== null) {
	                    var params = _.compact(matches.slice(1,4))
	                    var currentPath = {};
	                    params.forEach(function(p) {
	                        var parts = p.split(" ");
	                        var key = parts[0].trim().replace(":", ""),
	                            value = parts[1].trim();
	                        if(value)
	                        	currentPath[key] = value;
	                    })
	                    var actionStr = matches[4];

	                    
	                    if(actionStr.indexOf("=") !== -1) {
	                        actionStr = actionStr.split("=")[0];
	                    }
	                    if(actionStr.indexOf(".") !== -1) {
	                        actionStr = actionStr.split(".");
	                        actionStr = actionStr[actionStr.length - 1];
	                    }
	                    currentPath['action'] = actionStr.trim();
	                    currentPath['handlerPath'] = fpath;
	                    
	                    paths.push(currentPath);
	                }
	            });
				cb(null, paths);
	        }
	    }); 
	}
};