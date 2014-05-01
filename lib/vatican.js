var http = require("http"), 
    logger = require("./logger"), 
    fs = require("fs"),
    _ = require("lodash");


module.exports = Vatican;

function Vatican(opts) {
    this.options = opts;
    this.checkOptions();
    this.requestParser = opts.requestParser ? opts.requestParser : require("./defaultRequestParser");
    this.parseHandlers();
    this.paths = [];
    this.server = null;
}

Vatican.prototype.parseHandlers = function() {
    var dir = this.options.handlers;
    var self = this;
    fs.readdir(dir, function(err, files) {

        if(err) {
            logger.error("Error reading folder: " + dir);
        } else {
            var fpath = "";
            _(files).where(function(f) { return f.match(/\.js$/i); }).forEach(function(fname) {
                fpath = dir + "/" + fname;
                logger.info("Openning file: " + fpath);
                var content = fs.readFileSync(fpath).toString();
                var regExp = /@endpoint ?\((url:.+) (method:.+)\)\n(.*)\(/gim;
                while( (matches = regExp.exec(content)) !== null) {
                    var params = matches.slice(1,3);
                    var currentPath = {};
                    params.forEach(function(p) {
                        var parts = p.split(" ");
                        var key = parts[0].trim().replace(":", ""),
                            value = parts[1].trim();
                        currentPath[key] = value;
                    })
                    var actionStr = matches[3];

                    
                    if(actionStr.indexOf("=") !== -1) {
                        actionStr = actionStr.split("=")[0];
                    }
                    if(actionStr.indexOf(".") !== -1) {
                        actionStr = actionStr.split(".");
                        actionStr = actionStr[actionStr.length - 1];
                    }
                    currentPath['action'] = actionStr.trim();
                    currentPath['handlerPath'] = fpath;
                    
                    logger.info("Path found for : ");
                    logger.info(currentPath);
                    self.paths.push(currentPath);
                }
            });
        }
    }); 
}

/**
 Makes sure that the required options are there
*/
Vatican.prototype.checkOptions = function() {
    if( !this.options.port ) {
        logger.error("Port not specified, throwing error!");
        throw new Error("Port not specified");
    }

    if( !this.options.handlers ) {
        logger.error("Handlers folder not specified, throwing error!");
        throw new Error("Handlers folder not specified");
    }
};

Vatican.prototype.parseRequest = function( req, template, originalReq , cb) {
    this.requestParser.parse(req, template, originalReq, cb);
};

/*
    Writes the 404 response
*/
Vatican.prototype.writeNotFound = function( res ){ 
    logger.warn("404 Not found");
    res.writeHead(404);
    res.end();
};

/**
    Checks all paths until one that matches the current url is found.
    If there is no match, then false is returned
*/
Vatican.prototype.findMethod = function( url, method ) {
    var path = (url.indexOf("?") == -1) ? url : url.split("?")[0];
   
    var match = _.find(this.paths, function(item) { 
        var regExpStr = item.url.replace(/:.+(\/)?/g,".+$1");
        logger.info("Trying to match: [" + item.method + "] " + regExpStr + " with: [" + method + "] " + path);
        var regExp = new RegExp(regExpStr + "$");
        return regExp.test(path) && (item.method.toLowerCase() === method.toLowerCase());
    });
    return match;
};

Vatican.prototype.createRequest = function(req) {
    var newReq = {
        url: req.url,
        method: req.method
    };

    return newReq;
};

Vatican.prototype.improveResponse = function(res) {
    res.send = function(txt) {
        var headers = {};
        for(var i in res.headers) {
            headers = _.assign(headers, res.headers[i]);
        }
        res.writeHead(res.statusCode, headers);
        res.write(txt);
        res.end();
    };

    res.statusCode = 200; //default response code, used on the send method
    
    res.setHeader = function(head) {
        if(!Array.isArray(res.headers)) {
            res.headers = [];
        }
        var header = {};
        header[head[0]] = head[1];
        res.headers.push(header);
    }
    return res;
}

/*
    Reads the handler code, comments out the annotation, then 
    loads the code as a require would and finally returns the new
    handler instance
*/
Vatican.prototype.loadHandler = function(path) {
    var Module = module.constructor
    var m = new Module();

    var handlerContent = fs.readFileSync(path);
    handlerContent = handlerContent.toString().replace(/(@endpoint.+\n)/g,"//$1");

    m._compile(handlerContent, path);
    return new m.exports;
};

/**
    Handles each request, by looking up the right handler/method to execute
*/
Vatican.prototype.requestHandler = function (req, res) { 
    logger.info("Request received: [" + req.method + "]: " + req.url);
    var methodFound = this.findMethod(req.url, req.method);
    if( !methodFound ) {
        this.writeNotFound(res);
    } else {
        try {
            res = this.improveResponse(res);
            var request = this.createRequest(req);
            var hdlr = this.loadHandler(process.cwd() + "/" + methodFound.handlerPath);
            this.parseRequest(request, methodFound.url, req, function(newRequest) {
                hdlr[methodFound.action](newRequest, res);
            });
        } catch (ex) {
            logger.error("Error instantiating handler: " + ex.message);
            logger.error("Stacktrace: " + ex.stack);
            res.end();
        }
    }
};

/**
    Starts up the server
*/
Vatican.prototype.start = function() {
    try {
        this.server = http.createServer(this.requestHandler.bind(this));
        this.server.listen(this.options.port);
        logger.info("Server started on port: " + this.options.port);
    } catch (ex) {
        logger.error("Error creating server: " + ex.message);
        return false;
    }
};

