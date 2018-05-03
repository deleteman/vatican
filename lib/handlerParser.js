'use strict'

const logger = require("./logger"), 
	fs = require("fs"),
	stripComments = require("strip-json-comments"),
	os = require("os"),
	_ = require("lodash");


const CONFIG_FILE_PATH = process.cwd() + "/vatican-conf.json";


const CLASS_HEADER_REGEXP = /class ([a-zA-Z0-9]+ *){/;

const ES5endpointRE = /@endpoint\s*\((url:.+)\s*(method:(?:[ \t]*)(?:get|put|post|delete))\s*(name:.+)?\s*\)[\s\n]*([^\s]*)\.prototype\.([^\s]*)/gim

//const ES6endpointRE = /@endpoint\s*\((url:.+)\s*(method:(?:[ \t]*)(?:get|put|post|delete))\s*(name:.+)?\s*(versions:\s*\[.+\]\s*)?\s*\)[\s\n]*([a-zA-Z0-9_]*)\([a-zA-Z0-9 ,]*\)/gim
//const ES6endpointRE = /@endpoint\s*\((url:.+)\s*(method:(?:[ \t]*)(?:get|put|post|delete))\s*(name:.+)?\s*(versions:(?:[ \t]*)\[[0-9.,]+\]\s*)?\s*\)[\s\n]*([a-zA-Z0-9_]*)\([a-zA-Z0-9 ,]*\)/gim
//const ES6endpointRE = /@endpoint\((url:.+)\s*(method:(?:[ \t]*)(?:get|put|post|delete))\s*(name:\s*[a-zA-Z_]+)?\s*(versions:(?:[ \t]*)\[.+\]\s*)?\s*\)[\s\n]*([a-zA-Z0-9_]*)\([a-zA-Z0-9 ,]*\)/gim
const ES6endpointRE = /(?:@endpoint)?\(?((?:[a-z]+:\s*[a-z_:,\.\[\]\/0-9]+)+)[ ]*\)?/gim
const ES6ActionNameRE = /[\t]*([a-z]+)\([a-z, ]+\)/i

const ES6classNameRE = /class ([a-zA-Z-0-9_ ]+) *{/;


module.exports = class HandlerParser {

	static parse(dir, cb) {
		var paths = [];
	    fs.readdir(dir, function(err, files) {

	        if(err) {
	            logger.error("Error reading folder: " + dir);
	            cb("Error reading folder: " + dir);
	        } else {
	        	let fpath = "";
	        	let matches = null,
	        		handlerName = null,
	        		content = null;


	            _(files).where(function(f) { return f.match(/\.js$/i); }).forEach(function(fname) {
	                fpath = dir + "/" + fname;
	                logger.info("Openning file: " + fpath);
	                content = fs.readFileSync(fpath).toString();
	                let matchesParser = new ES5MatchesParser(fpath);

	                if(content.match(CLASS_HEADER_REGEXP)) {
	                	logger.info("ES6 class detected, using ES6 params");
	                	let classNameParts = content.match(ES6classNameRE);
						let handlerClassName = classNameParts[1].trim();
		                matchesParser = new ES6MatchesParser(fpath, handlerClassName);
	                } 
	                content = content.replace(/\/\/\s*@/g, "@") //We allow commenting the line of the endpoint for correct editor syntax coloring
	                content = stripComments(content) //we remove the comments so we don't deal with commented out endpoints

	                matchesParser.parse(content, (match) => {
	                	paths.push(matchesParser.getPath(match));
	                })

	            });
				cb(null, paths);
	        }
	    });
	}

}

function parseVersionsMetadata(data) {
	return data.replace(/\[/g, "").replace(/\]/g, "").split(",");
}

class ES6MatchesParser {

	constructor(fpath, className) {
		this.fpath = fpath;
		this.className = className;
	}

	parse(content, matchCB) {
		let lines = content.split(os.EOL);
		let annotationMatches;
		lines.forEach( (line, idx) => {
			let metadata = [];
			if(line.indexOf("@endpoint") != -1) {
				while (annotationMatches = ES6endpointRE.exec(line)){ 
					metadata.push(annotationMatches[1])
				}
				if(metadata.length > 0) {
					let nextLine =  lines[idx + 1]
					let actionMetadata = nextLine.match(ES6ActionNameRE)//.exec(nextLine)
					if(actionMetadata){
						metadata.push('action: ' + actionMetadata[1])
					}
					matchCB(metadata);
				}
			}
		})

	}

	getPath(matches) {
        let currentPath = {
        	versions: []
        };
        let actionStr = "";
        matches.forEach( p => {
            var parts = p.split(":"),
            	key = parts.shift(),
                value = parts.join(":").trim();
            if(key == "versions") {
            	value = parseVersionsMetadata(value);
            }
            if(key == "action") {
            	actionStr = value.trim();
            }
            if(value) currentPath[key] = value;
        })
        
        //currentPath['action'] = actionStr.trim();
        currentPath['handlerPath'] = this.fpath;
        currentPath['handlerName'] = this.className;
        currentPath.method = currentPath.method.toUpperCase()
        return currentPath;
	}
}

class ES5MatchesParser {
	constructor(fpath) {
		this.fpath = fpath;
	}

	parse(content, matchCB) {
		let matches = null;
        while( (matches = ES5endpointRE.exec(content)) !== null) {
        	matchCB(matches);	
        }
	}

	getPath(matches) {
        let params = _.compact(matches.slice(1,4))
        let currentPath = {};
        params.forEach(function(p) {
            let parts = p.split(":"),
            	key = parts.shift(),
                value = parts.join(":").trim();
            if(value) currentPath[key] = value;
        })
        let actionStr = matches[5],
            handlerName = matches[4]
        
        currentPath['action'] = actionStr.trim();
        currentPath['handlerPath'] = this.fpath;
        currentPath['handlerName'] = handlerName
        currentPath.method = currentPath.method.toUpperCase()
        return currentPath;
	}
}

