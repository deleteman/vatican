var _ = require("lodash"),
    logger = require("./logger");

//Custom response 

function VaticanResponse(originalResp, originalReq, options, postProcessChain) {
    this.response = originalResp;
    this.request = originalReq;
    this.statusCode = 200; //default response code, used on the send method
    this.options = options;
    this.headers = [];
    this.ppChain = postProcessChain;
    this.body = "";
}

VaticanResponse.prototype.send = function(txt) {
    var headers = {};
    var self = this;
    this.body = txt;
    this.ppChain.runChain({
       req: this.request, 
       res: this, 
       finalFn: function(req, resp) {
              //Check for CORS config
              if(self.options.cors !== false) {
                  headers = _getCORSHeaders(self.options.cors);
              }

              //Adds the rest of the headers
              for(var i in resp.headers) {
                  headers = _.assign(headers, resp.headers[i]);
              }

              //Write the headers
              resp.response.writeHead(resp.statusCode, headers);
              if( typeof resp.body == 'object') {
                  resp.body = JSON.stringify(resp.body);
              }

              //Write out the response text
              resp.response.write(resp.body);
              resp.response.end();
       },
    })
    
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

function _improveResponse(resp, req, options, postprocessChain) {
   var res = new VaticanResponse(resp, req, options, postprocessChain);
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
