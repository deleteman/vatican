var _ = require("lodash"),
    logger = require("./logger"),
    qs = require('qs');

module.exports = {
    getUrlParams: function(path, template) {
        var pathParts = path.split("/"),
            urlParams = {},
            tmpltParts = template.split("/");

        _.each(pathParts, function(p, idx) {
            if(tmpltParts[idx][0] === ":") { 
                urlParams[tmpltParts[idx].slice(1)] = p;
            }
        });
        return urlParams;
    },
    getBodyContent: function(req, cb) {
        var self = this;
        if( ["POST", "PUT"].indexOf(req.method.toUpperCase()) == -1 ) {
            cb({});
            return;
        }            
        var bodyStr = "";
        req.on('data', function(chunk) {
            bodyStr += chunk.toString();
        })

        req.on('end', function() {
            if(bodyStr.match(/^\S+=\S+&?/)) {
                cb(qs.parse(bodyStr));
            } else {
                try {
                    return cb(JSON.parse(bodyStr))
                } catch (ex) {
                    return cb(bodyStr);
                }
            }
        });
    },

    parse: function(req, template, originalReq, cb) {
        var startQs = req.url.indexOf("?"),
            path = ~startQs ? req.url.substr(0, startQs) : req.url, 
            querystring = ~startQs ? req.url.substr(startQs + 1).trim() : '',
            self = this;
        
        this.getBodyContent(originalReq, function(postBody) {
            req.params = {
                url: self.getUrlParams(path, template),
                query: qs.parse(querystring),
                body: postBody 
            };
            cb(req);
        });
        
    }
}
