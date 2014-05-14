var http = require("http"), 
    logger = require("./logger"), 
    fs = require("fs"),
    vaticanResp = require("./vaticanResponse"),
    handlerParser = require("./handlerParser"),
    _ = require("lodash");


module.exports = Vatican;
var CONFIG_FILE_PATH = process.cwd() + "/vatican-conf.json";

function Vatican() {
    var config = null;
    try {
        config = require(CONFIG_FILE_PATH);
    } catch(ex) {
        logger.error("Error loading config file '" + CONFIG_FILE_PATH + "': " + ex);
        return;
    }
    this.options = _.defaults( config, { cors: false } );
    this.checkOptions();
    this.requestParser = config.requestParser ? config.requestParser : require("./defaultRequestParser");
    this.parseHandlers();
    this.paths = [];
    this.server = null;
}

Vatican.prototype.parseHandlers = function() {
    var dir = this.options.handlers;
    var self = this;
    handlerParser.parse(function(err, path) {
        if(!err) {
            self.paths = path;
        }
    }) 
};

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

/**
    Checks all paths until one that matches the current url is found.
    If there is no match, then false is returned
*/
Vatican.prototype.findMethod = function( url, method ) {
    var path = (url.indexOf("?") == -1) ? url : url.split("?")[0];
   
    var match = _.find(this.paths, function(item) { 
        var regExpStr = item.url.replace(/:.+(\/)?/g,".+$1");
        //logger.info("Trying to match: [" + item.method + "] " + regExpStr + " with: [" + method + "] " + path);
        var regExp = new RegExp(regExpStr + "$");
        return regExp.test(path) && (item.method.toLowerCase() === method.toLowerCase());
    });
    return match;
};

/*
    Adds usefull methods and properties to node's original request object.
    Note: Right now, there is nothing to be added, but I left the method here in case
    I think of something in the future.
*/
Vatican.prototype.createRequest = function(req) {
    return req;
};

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
        vaticanResp.writeNotFound(res);
    } else {
        try {
            res = vaticanResp.improveResponse(res, this.options);
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

