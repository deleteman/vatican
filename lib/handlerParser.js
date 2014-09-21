var logger = require("./logger"), 
	fs = require("fs"),
	stripComments = require("strip-json-comments"),
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
	            var regExp = /@endpoint\s*\((url:.+)\s*(method:(?:[ \t]*)(?:get|put|post|delete))\s*(name:.+)?\s*\)[\s\n]*([^\s]*)\.prototype\.([^\s]*)/gim

	            _(files).where(function(f) { return f.match(/\.js$/i); }).forEach(function(fname) {
	                fpath = dir + "/" + fname;
	                logger.info("Openning file: " + fpath);
	                var content = fs.readFileSync(fpath).toString();
	                content = content.replace(/\/\/\s*@/g, "@") //We allow commenting the line of the endpoint for correct editor syntax coloring
	                content = stripComments(content) //we remove the comments so we don't deal with commented out endpoints

	                while( (matches = regExp.exec(content)) !== null) {
	                    var params = _.compact(matches.slice(1,4))
	                    var currentPath = {};
	                    params.forEach(function(p) {
	                        var parts = p.split(":"),
	                        	key = parts.shift(),
	                            value = parts.join(":").trim();
	                        if(value)
	                        	currentPath[key] = value;
	                    })
	                    var actionStr = matches[5]
	                        handlerName = matches[4]
	                    
	                    currentPath['action'] = actionStr.trim();
	                    currentPath['handlerPath'] = fpath;
	                    currentPath['handlerName'] = handlerName
	                    currentPath.method = currentPath.method.toUpperCase()
	                    
	                    paths.push(currentPath);
	                }
	            });
				cb(null, paths);
	        }
	    }); 
	}
};
