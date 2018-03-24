'use strict'

var logger = require("./logger"), 
	fs = require("fs"),
	stripComments = require("strip-json-comments"),
	_ = require("lodash");


const CONFIG_FILE_PATH = process.cwd() + "/vatican-conf.json";


const CLASS_HEADER_REGEXP = /class ([a-zA-Z0-9]+ *){/;

const ES5endpointRE = /@endpoint\s*\((url:.+)\s*(method:(?:[ \t]*)(?:get|put|post|delete))\s*(name:.+)?\s*\)[\s\n]*([^\s]*)\.prototype\.([^\s]*)/gim

const ES6endpointRE = /@endpoint\s*\((url:.+)\s*(method:(?:[ \t]*)(?:get|put|post|delete))\s*(name:.+)?\s*\)[\s\n]*([a-zA-Z0-9_]*)\([a-zA-Z0-9 ,]*\)/gim
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
	        		chosenRegExp = ES5endpointRE, //default choice
	        		handlerName = null,
	        		content = null;


	            _(files).where(function(f) { return f.match(/\.js$/i); }).forEach(function(fname) {
	                fpath = dir + "/" + fname;
	                logger.info("Openning file: " + fpath);
	                content = fs.readFileSync(fpath).toString();
	                let matchesParser = new ES5MatchesParser(fpath);

	                if(content.match(CLASS_HEADER_REGEXP)) {
	                	logger.info("ES6 class detected, using ES6 params");
	                	chosenRegExp = ES6endpointRE;
	                	let classNameParts = content.match(ES6classNameRE);
						let handlerClassName = classNameParts[1].trim();
		                matchesParser = new ES6MatchesParser(fpath, handlerClassName);
	                } 
	                content = content.replace(/\/\/\s*@/g, "@") //We allow commenting the line of the endpoint for correct editor syntax coloring
	                content = stripComments(content) //we remove the comments so we don't deal with commented out endpoints

	                while( (matches = chosenRegExp.exec(content)) !== null) {
	                    paths.push(matchesParser.getPath(matches));
	                }
	            
	            });
				cb(null, paths);
	        }
	    });
	}

}

class ES6MatchesParser {

	constructor(fpath, className) {
		this.fpath = fpath;
		this.className = className;
	}

	getPath(matches) {
        let params = _.compact(matches.slice(1,4));
        let currentPath = {};
        params.forEach(function(p) {
            var parts = p.split(":"),
            	key = parts.shift(),
                value = parts.join(":").trim();
            if(value) currentPath[key] = value;
        })
        let actionStr = matches[4];
        
        currentPath['action'] = actionStr.trim();
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

