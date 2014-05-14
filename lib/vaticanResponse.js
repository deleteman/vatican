var _ = require("lodash"),
    logger = require("./logger");

//Custom response 

function VaticanResponse(originalResp, options) {
    this.response = originalResp;
    this.statusCode = 200; //default response code, used on the send method
    this.options = options;
    this.headers = [];
}

VaticanResponse.prototype.send = function(txt) {
    var headers = {};
    if(this.options.cors !== false) {
        headers = _getCORSHeaders(this.options.cors);
    }

    for(var i in this.headers) {
        headers = _.assign(headers, this.headers[i]);
    }

    this.response.writeHead(this.response.statusCode, headers);
    if( typeof txt == 'object') {
        txt = JSON.stringify(txt);
    }

    this.response.write(txt);
    this.response.end();
};

VaticanResponse.prototype.write = function(txt) {
    this.response.write(txt);
}

VaticanResponse.prototype.end = function() {
    this.response.end();
}

VaticanResponse.prototype.setHeader = function(head) {
    if(!Array.isArray(this.headers)) {
        this.headers = [];
    }
    var header = {};
    header[head[0]] = head[1];
    this.headers.push(header);
};

///Module level methods

function _improveResponse(resp, options) {
   var res = new VaticanResponse(resp, options);
   return res;
}
/*
    Writes the 404 response
*/
function _writeNotFound( res ){ 
    logger.warn("404 Not found");
    res.writeHead(404);
    res.end();
}

function _getCORSHeaders(corsOpts) {
    if ( corsOpts === true ) {
       return {
        "Access-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"
       } 
    } else {
        return {
            "Access-Allow-Origin":              corsOpts.access_allow_origin || "",
            "Access-Control-Allow-Methods":     corsOpts.acess_control_allow_methods || "",
            "Access-Control-Expose-Headers":    corsOpts.access_control_expose_headers || "",
            "Access-Control-Max-Age":           corsOpts.access_control_max_age || "" ,
            "Access-Control-Allow-Credentials": corsOpts.access_control_allow_credentials || "",
            "Access-Control-Allow-Headers":     corsOpts.access_control_allow_headers || ""
        }
    }
}


module.exports = {
    improveResponse: _improveResponse,
    writeNotFound: _writeNotFound
};