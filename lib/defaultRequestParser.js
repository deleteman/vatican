var _ = require("lodash"),
    logger = require("./logger");

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
            if(bodyStr.match(/\S+=\S+&?/)) {
                cb(self.getQueryParams("?" + bodyStr));
            } else {
                cb(bodyStr);
            }
        });
    },
    getQueryParams: function (url) {
        var paramsStr = url.split("?")[1];
        if(!paramsStr) return {};
        var params = paramsStr.split("&"),
            paramsObj = {};

        _(params).each(function(param) {
            var parts = param.split("=");
            paramsObj[parts[0]] = parts[1];
        });
        return paramsObj;
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
