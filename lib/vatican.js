'use strict'
const http = require("http"), 
    EventEmitter = require("events"),
    logger = require("./logger"), 
    util = require("util"),
    fs = require("fs"),
    vaticanResp = require("./vaticanResponse"),
    handlerParser = require("./handlerParser"),
    processingChain = require("./processingChain"),
    mongoose = require("mongoose"),
    EventsEnum = require("./eventsEnum"),
    OptionsResponse = require("./optionsresponse"),
    _ = require("lodash");


module.exports = Vatican;
var CONFIG_FILE_PATH = process.cwd() + "/vatican-conf.json";
const HEADER_VERSION_REGEXP = /accept\/vnd.vatican-version\.(.+)\+json/gi

const DEFAULT_SCHEMAS_FOLDER = process.cwd() + '/schemas';

var DEFAULT_CONFIG = {
    cors: false,
    schemasFolder: DEFAULT_SCHEMAS_FOLDER,
    db: {
        host: 'localhost',
        dbname: 'vatican-project'        
    }
}

function Vatican(options) {
    let config = null;
    this.dbconn = null
    try {
        config = (options) ? options : require(CONFIG_FILE_PATH);
    } catch(ex) {
        logger.error("Error loading config file '" + CONFIG_FILE_PATH + "': " + ex);
        return;
    }

    this.eventEmitter = new EventEmitter();
    this.options = _.defaults( config, DEFAULT_CONFIG);
    this.checkOptions();
    this.requestParser = config.requestParser ? require(config.requestParser) : require("./defaultRequestParser");

    this.handlers = {};

    this.parseHandlers((err, paths) => {
        if(err) return this.eventEmitter.emit(EventsEnum.INITERROR, err);
        this.eventEmitter.emit(EventsEnum.VATICANREADY, paths);
    });
    this.on(EventsEnum.INTERNAL_DBSTART, this.onDbStart.bind(this));
    this.paths = [];
    this.server = null;
    this.totalPreprocessors = 0;
    this.preprocessors = new processingChain();
    this.postprocessors = new processingChain();
}

Vatican.prototype.on = function(event, cb) {
    this.eventEmitter.on(event, cb);
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
        if(typeof cb == 'function') cb(null, self.paths)
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

    if(this.options.versioning) {
        if( this.options.versioning.format && !this.options.versioning.matching ) {
            logger.error("Versioning error: Missing matching function");
            throw new Error("Versioning error: matching function is needed when format function is provided");
        }
    }
};

Vatican.prototype.parseRequest = function( req, template, originalReq , cb) {
    this.requestParser.parse(req, template, originalReq, cb);
};


function matchVersions(versionList, version, versioning) {
    //If there are no versions defined on the annotation, the endpoint is meant to be 
    //used on all versions
    if(!util.isArray(versionList)) return true;

    if(versionList.indexOf(version) != -1) return true; 

    return versionList.find((v) => {
        if(versioning.matching) {
            return versioning.matching(version, v);
        } else {
            return version == v;
        }
    });
}


/**
Helper function used to find registered urls
*/
Vatican.prototype.findURLs = function findURLs(path, methodToMatch, versionToMatch) {
    let nmbrOfParts = path.split("/").length;
    let self = this;

    return function (item) { 
        let regExpStr = item.url.replace(/\:.+(\/)?/g,".+$1");
        let nmbrOfPartsPath = item.url.split("/").length;
        let regExp = new RegExp(regExpStr + "$");

        logger.debug("Matching: " + path + " to " + regExp)

        let boolExpression = nmbrOfPartsPath == nmbrOfParts && regExp.test(path);
        if(methodToMatch) {
            boolExpression = boolExpression && item.method.toLowerCase() == methodToMatch.toLowerCase();
        }
        if(versionToMatch) {
            boolExpression = boolExpression && matchVersions(item.versions, versionToMatch, self.options.versioning);
        }
        return  boolExpression;
    }
}

Vatican.prototype.handleOptionsRequest = function (path, versionToMatch) {

    //should also allow for url = *
    let validMethods = _(this.paths);
    if(["*", "/*"].indexOf(path) == -1 ) {
        validMethods = validMethods.filter(this.findURLs(path, null, versionToMatch))
    } 
    validMethods = validMethods.pluck('method')
                            .unique()
                            .value()
                            .join(",")

    return validMethods;
}

Vatican.prototype.parseURLVersioning = function(url, headers) {
    if(this.options.versioning.strategy == "url") {
        let urlParts = url.split("/");
        let version = urlParts[1];
        let path= urlParts.slice(2).join("/"); //remove the version part from thepath 
        if(path[0] != "/") path= "/" + path; //adjust, because we need the url to start with a "/" 
        return {
            path: path,
            version: version
        }
    }

    if(this.options.versioning.strategy == "header") {
        logger.debug("Headers: ", headers);
        let acceptHeader = headers.accept;
        let match = HEADER_VERSION_REGEXP.exec(acceptHeader);
        return {
            path: url,
            version: match[1]
        }

    }
}

/**
    Checks all paths until one that matches the current url is found.
    If there is no match, then false is returned
*/
Vatican.prototype.findMethod = function( url, method, headers ) {
    let path = (url.indexOf("?") == -1) ? url : url.split("?")[0];

    ///URL version
    let version = null;

    if(this.options.versioning) {
        ({path, version} = this.parseURLVersioning(url, headers));
    }

    if(method.toUpperCase() == 'OPTIONS') {
        let validMethods = this.handleOptionsRequest(path, version)
        return new OptionsResponse(validMethods);
    }
 
    logger.debug("URL: " + path);
    logger.debug("URL version: " + version);
    var match = _.find(this.paths, this.findURLs(path, method, version) );
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
    var methodFound = this.findMethod(req.url, req.method, req.headers);
    if( !methodFound ) {
        vaticanResp.writeNotFound(res);
    } else {
        try {
            res = vaticanResp.improveResponse(res, request, this.options, this.postprocessors);
            if(methodFound instanceof  OptionsResponse) {
                self.preprocessors.add({fn: methodFound.action.bind(methodFound) });
                self.preprocessors.runChain(null, res, null);
            } else {
                var request = this.createRequest(req);
                var hdlr = this.loadHandler(process.cwd() + "/" + methodFound.handlerPath);
                //Parse the request to grab the parameters
                this.parseRequest(request, methodFound.url, req, function(newRequest) {
                    //Run the pre-process chain and finally, call the handler
                    if(self.preprocessors.getTotal() > self.totalPreprocessors) {
                        self.preprocessors.pop();
                    }
                    var hdlrInstance = new hdlr(self.getCorrectModel(methodFound), self.dbmodels)
                    ///hdlrInstance.models = self.dbmodels //Let the handler access all other models in case they're neeeded
                    logger.debug("Action to execute: ", methodFound)
                    logger.debug(hdlrInstance)
                    self.preprocessors.add({fn: hdlrInstance[methodFound.action].bind(hdlrInstance)})
                    self.preprocessors.runChain(newRequest, res, null, methodFound);
                });
            }
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
    Param: cb (optional) A callback to execute after the server has been instantiated
*/
Vatican.prototype.start = function(cb) {
    try {
        this.dbStart(); //we initiate the db connection automatically
        this.server = http.createServer(this.requestHandler.bind(this));
        this.server.listen(this.options.port);
        logger.info("Server started on port: " + this.options.port);
        this.eventEmitter.emit(EventsEnum.HTTPSERVERREADY)
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

Vatican.prototype.__dbStart = function() {
    var connString = 'mongodb://' + this.options.db.host + '/' + this.options.db.dbname
    mongoose.connect(connString)
    return mongoose.connection
};

/**
Handles connection to the database
*/
Vatican.prototype.onDbStart = function() {

    let schemasFolder = this.options.schemasFolder

    this.loadDbModels(schemasFolder, (err, models) => {
        if(err) {
            return this.eventEmitter.emit(EventsEnum.DBERROR);
        }
        this.dbmodels = models
        this.eventEmitter.emit(EventsEnum.DBSTART)
    })
}

Vatican.prototype.dbStart = function(opts, cb) {
    if(typeof opts === 'function') {
        cb = opts
        opts = {}
    } else {
        if(!opts) {
            opts = {};
        }
    }
    this.options.schemasFolder = opts.schemasFolder || DEFAULT_SCHEMAS_FOLDER

    if(!this.dbconn) { //make sure if this gets called twice, it won't try to connect again
        this.dbconn = this.__dbStart()
        this.dbconn.on('error', (err) => {
            this.eventEmitter.emit(EventsEnum.DBERROR, err);
        })
        this.dbconn.once('open', () =>  {
            if(cb) {
                logger.warn("Deprecation warning: You're using 'dbStart' when you should be directly calling 'start' ");
                this.on(EventsEnum.DBSTART, cb);
            }
            this.eventEmitter.emit(EventsEnum.INTERNAL_DBSTART); 
        })
    }
    
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

