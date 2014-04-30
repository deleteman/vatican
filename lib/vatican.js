var http = require("http"), 
    logger = require("./logger"), 
    _ = require("lodash");


module.exports = Vatican;

function Vatican(opts) {
    this.options = opts;
    this.checkOptions();
    this.requestParser = opts.requestParser ? opts.requestParser : require("./defaultRequestParser");
    this.server = null;
}

/**
 Makes sure that the required options are there
*/
Vatican.prototype.checkOptions = function() {
    if( !this.options.port ) {
        logger.error("Port not specified, throwing error!");
        throw new Error("Port not specified");
    }

    if( !this.options.paths ) {
        logger.error("Path not specified, throwing error!");
        throw new Error("Paths not specified");
    }
};

Vatican.prototype.parseRequest = function( req, template ) {
    return this.requestParser.parse(req, template);
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
   
    var match = _.find(this.options.paths, function(item) { 
        var regExpStr = item.path.replace(/:.+(\/)?/g,".+$1");
        logger.info("Trying to match: " + regExpStr + " width: " + path);
        var regExp = new RegExp(regExpStr);
        return regExp.test(path) && item.method.toLowerCase() === method.toLowerCase();
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
            var request = this.createRequest(req);
            var hdlr = new methodFound.handler;
            request = this.parseRequest(request, methodFound.path);
            hdlr[methodFound.action](request, res);
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
        logger.info("Starting server on port: " + this.options.port);
        this.server.listen(this.options.port);
    } catch (ex) {
        logger.error("Error creating server: " + ex.message);
        return false;
    }
};

