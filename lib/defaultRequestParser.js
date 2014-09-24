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
                cb(self.getQueryParams("?" + bodyStr));
            } else {
                try {
                    return cb(JSON.parse(bodyStr))
                } catch (ex) {
                    return cb(bodyStr);
                }
            }
        });
    },
    getQueryParams: function (url) {
        var first = url.indexOf("?");
        if(first == -1) return {};
        return qs.parse(url.substr(first + 1).trim());
    },

    parse: function(req, template, originalReq, cb) {
        var path = req.url.split("?")[0],
            self = this,
            queryParams = {};
        
        this.getBodyContent(originalReq, function(postBody) {
            req.params = {
                url: self.getUrlParams(path, template),
                query: self.getQueryParams(req.url),
                body: postBody 
            };
            cb(req);
        });
        
    }
}
