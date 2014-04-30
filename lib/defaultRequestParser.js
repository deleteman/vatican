var _ = require("lodash");

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
    getQueryParams: function (url) {
        var paramsStr = url.split("?")[1];
        if(!paramsStr) return null;
        var params = paramsStr.split("&"),
            paramsObj = {};

        _(params).each(function(param) {
            var parts = param.split("=");
            paramsObj[parts[0]] = parts[1];
        });
        return paramsObj;
    },
    parse: function(req, template) {
        var path = req.url.split("?")[0],
            queryParams = {};
        
        req.urlParams = this.getUrlParams(path, template);
        req.queryParams = this.getQueryParams(req.url); 
        
        return req;
    }
}
