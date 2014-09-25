var http = require("http"), 
    logger = require("./logger"), 
    fs = require("fs"),
    vaticanResp = require("./vaticanResponse"),
    handlerParser = require("./handlerParser"),
    processingChain = require("./processingChain"),
    mongoose = require("mongoose"),
    _ = require("lodash");


module.exports = Vatican;
var CONFIG_FILE_PATH = process.cwd() + "/vatican-conf.json";

var DEFAULT_CONFIG = {
    cors: false,
    db: {
        host: 'localhost',
        dbname: 'vatican-project'        
    }
}

function Vatican(options) {
    var config = null;
    this.dbconn = null
    try {
        config = (options) ? options : require(CONFIG_FILE_PATH);
    } catch(ex) {
        logger.error("Error loading config file '" + CONFIG_FILE_PATH + "': " + ex);
        return;
    }
    this.options = _.defaults( config, DEFAULT_CONFIG);
    this.checkOptions();
    this.requestParser = config.requestParser ? require(config.requestParser) : require("./defaultRequestParser");

    this.handlers = {};

    this.parseHandlers();
    this.paths = [];
    this.server = null;
    this.totalPreprocessors = 0;
    this.preprocessors = new processingChain();
    this.postprocessors = new processingChain();
}

Vatican.prototype.preprocess = function(fn, endpointNames) {
    this.preprocessors.add({fn: fn, names: endpointNames ? endpointNames : []})
    this.totalPreprocessors = this.preprocessors.getTotal();
}

Vatican.prototype.postprocess = function(fn, endpointNames) {
    this.postprocessors.add({fn: fn, names: endpointNames ? endpointNames : []});
}

Vatican.prototype.parseHandlers = function(cb) {
    var dir = this.options.handlers;
    var self = this;
    handlerParser.parse(dir, function(err, path) {
        if(typeof cb == 'function' && err) return cb(err)
        if(!err) {
            self.paths = path;
        }
        if(typeof cb == 'function') cb(self.paths)
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
    var nmbrOfParts = path.split("/").length;
    var nmbrOfPartsPath = null,
        regExpStr = null,
        regExp = null
   
    var match = _.find(this.paths, function(item) { 
        regExpStr = item.url.replace(/\:.+(\/)?/g,".+$1");
        nmbrOfPartsPath = item.url.split("/").length;
        regExp = new RegExp(regExpStr + "$");
        return  nmbrOfPartsPath == nmbrOfParts && (item.method.toLowerCase() === method.toLowerCase()) && regExp.test(path);
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
    var key = new Buffer(path).toString('base64')

    if(this.handlers[key]) return this.handlers[key];

    var Module = module.constructor
    var m = new Module();

    var handlerContent = fs.readFileSync(path);
    handlerContent = handlerContent.toString().replace(/(@endpoint.+\n)/g,"//$1");
    m.paths = module.paths;
    try {
        m._compile(handlerContent, path);
        this.handlers[key] = m.exports;
    } catch (ex) {
        logger.error("Error compiling handler: ", ex)
    }
    return this.handlers[key];
};

/**
    Handles each request, by looking up the right handler/method to execute
*/
Vatican.prototype.requestHandler = function (req, res) { 
    logger.info("Request received: [" + req.method + "]: " + req.url);
    var self = this;
    var methodFound = this.findMethod(req.url, req.method);
    if( !methodFound ) {
        vaticanResp.writeNotFound(res);
    } else {
        try {
            var request = this.createRequest(req);
            var hdlr = this.loadHandler(process.cwd() + "/" + methodFound.handlerPath);
            res = vaticanResp.improveResponse(res, request, this.options, this.postprocessors);
            //Parse the request to grab the parameters
            this.parseRequest(request, methodFound.url, req, function(newRequest) {
                //Run the pre-process chain and finally, call the handler
                if(self.preprocessors.getTotal() > self.totalPreprocessors) {
                    self.preprocessors.pop();
                }
                var hdlrInstance = new hdlr(self.getCorrectModel(methodFound))
                hdlrInstance.models = self.dbmodels //Let the handler access all other models in case they're neeeded
                self.preprocessors.add({fn: hdlrInstance[methodFound.action].bind(hdlrInstance)})
                self.preprocessors.runChain(newRequest, res, null, methodFound);
            });
        } catch (ex) {
            logger.error("Error instantiating handler: " + ex.message);
            logger.error("Stacktrace: " + ex.stack);
            res.end();
        }
    }
};

Vatican.prototype.getCorrectModel = function(handler) {
    if(this.dbmodels) {
        var modelName = handler.handlerName.replace("Hdlr", '')
        return this.dbmodels[modelName]
    } 
    return false
}


/**
    Starts up the server
*/
Vatican.prototype.start = function(cb) {
    try {
        this.server = http.createServer(this.requestHandler.bind(this));
        this.server.listen(this.options.port);
        logger.info("Server started on port: " + this.options.port);
        if(typeof cb == 'function') {
            cb();
        }
    } catch (ex) {
        logger.error("Error creating server: " + ex.message);
        return false;
    }
};


/**
   Close the server
*/
Vatican.prototype.close = function(cb) {
    try {
        this.server.close();
        logger.info("Server closed");
        if(typeof cb == 'function') {
            cb();
        }
    } catch (ex) {
        logger.error("Error closing server: " + ex.message);
        return false;
    }
}

Vatican.prototype.__dbStart = function(first_argument) {
    var connString = 'mongodb://' + this.options.db.host + '/' + this.options.db.dbname
    mongoose.connect(connString)
    return mongoose.connection
};

Vatican.prototype.dbStart = function(opts, cb) {
    if(typeof opts === 'function') {
        cb = opts
        opts = {}
    }
    var self = this

    var schemasFolder = opts.schemasFolder || process.cwd() + '/schemas'

    self.dbconn = this.__dbStart()
    self.dbconn.on('error', cb)
    self.dbconn.once('open', function() {
        self.loadDbModels(schemasFolder, function(err, models) {
            if(err) {
                return cb(err)
            }
            self.dbmodels = models
            cb()
        })
    })
    
}

Vatican.prototype.loadDbModels = function(folder, cb) {
    var models = {}
    var self = this
    fs.readdir(folder, function(err, files) {
        if(err) return cb(err)
        var path = null, tmp = null
        files.forEach(function(f) {
            path = folder + "/" + f
            tmp = require(path)(mongoose)
            models[tmp.modelName] = tmp
        })
        cb(null, models)
    })
}

