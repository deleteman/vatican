var request = require('supertest'),
    should = require('should'),
    vatican = require('../'),
    http = require('http');

describe('vatican http methods', function() {
    var app = new vatican({
        'handlers': __dirname + '/fixtures/vaticanHttpMethods/handlers',
        'port': 24000,
    });

    before(function() {
        app.start();
    });

    after(function() {
        app.close();
    });

    [
        'get', 
        'put', 
        'post', 
        'delete'
    ].forEach(function(method) {
        it(method + " method without params", function( done ) {
            request('http://localhost:24000')[method]('/people')
                .expect(200) //statusCode
                .expect(method + ',user0,user1', done); //body
        });
    });
});
