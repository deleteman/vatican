var should = require('should'); //for mocha tests
var parse = require('../lib/handlerParser.js').parse;
var fs = require('fs');
var _ = require('lodash');

var dir = __dirname + '/fixtures/handlerParser';
let supportedMethodsDir = dir + '/supportedMethods';

describe("handlerParser.parse method", function() {
    describe("ES6 supported methods", () => {
        it("should support all basic methods method", (done) =>  {
            let dirname = dir + "/es6-basic";
            parse(dirname, (err, paths) => {
                if(err) return done(err);
                paths[0].method.should.be.equal('GET');
                paths[1].method.should.be.equal('PUT');
                paths[2].method.should.be.equal('POST');
                paths[3].method.should.be.equal('DELETE');
                done();
            })
        })
        it("should support all basic methods methods without names", (done) =>  {
            let dirname = dir + "/es6-no-names";
            parse(dirname, (err, paths) => {
                if(err) return done(err);
                paths[0].method.should.be.equal('GET');
                paths[1].method.should.be.equal('PUT');
                paths[2].method.should.be.equal('POST');
                paths[3].method.should.be.equal('DELETE');
                done();
            })
        })
    })

    describe('ES5 supported methods', function() {
        ['get', 'put', 'post', 'delete']
            .forEach(function(method) {
                it(method, function(done) {
                    var dirname = supportedMethodsDir + '/' + method;
                    parse(dirname, function(err, paths) {
                        if (err) return done(err);
                        paths[0].method.should.be.equal(method.toUpperCase());
                        done();
                    });

                });
            });

        it('unsuported', function(done) {
            var dirname = supportedMethodsDir + '/unsuported';
            parse(dirname, function(err, paths) {
                if (err) return done(err);

                paths.length.should.be.equal(0);
                done();
            });

        });
    });

    describe('', function() { 
        //Originally this was meant to test that no endpoint could be parsed, but since it works I think we can leave it at that
        it("the @endpoint does not follow any character", function(done) {
            var dirname = dir + '/notFollowAnyCharacter';
            parse(dirname, function(err, paths) {
                if (err) return done(err);

                paths.length.should.be.equal(1);
                done();
            });
        });
    });

    it("independent of number of spaces and tabs between the elements", function(done) {
        var dirname = dir + '/independentSpacesTabs';

        parse(dirname, function(err, paths) {
            if (err) return done(err);

            paths.length.should.not.equal(0);
            
            var compareWith = {
                url: '/books',
                method: 'GET',
                action: 'list',
                handlerPath: dirname + '/default.js',
                handlerName: 'default',
                name: 'name_param',
            };

            paths[0].url.should.be.equal(compareWith.url);
            paths[0].method.should.be.equal(compareWith.method);
            paths[0].action.should.be.equal(compareWith.action);
            paths[0].handlerPath.should.be.equal(compareWith.handlerPath);
            paths[0].handlerName.should.be.equal(compareWith.handlerName);
            paths[0].name.should.be.equal(compareWith.name);

            _.isEqual(paths[0], compareWith).should.be.true;
            done();
        });
    });


    it("independent of comments", function(done) {
        var dirname = dir + '/independentComments';

        parse(dirname, function(err, paths) {
            if (err) return done(err);
            
            paths.length.should.equal(2);

            var compareWith = [{
                url: '/books',
                method: 'GET',
                action: 'list',
                handlerPath: dirname + '/default.js',
                handlerName: 'default',
                name: 'name_param',
            },
            {   url: '/books',
                method: 'POST',
                action: 'newBook',
                handlerPath: dirname + '/default.js',
                handlerName: 'default',
                name: 'new_book'
            }
            ]

            paths[0].url.should.be.equal(compareWith[0].url);
            paths[0].method.should.be.equal(compareWith[0].method);
            paths[0].action.should.be.equal(compareWith[0].action);
            paths[0].handlerPath.should.be.equal(compareWith[0].handlerPath);
            paths[0].handlerName.should.be.equal(compareWith[0].handlerName);
            paths[0].name.should.be.equal(compareWith[0].name);

            paths[1].url.should.be.equal(compareWith[1].url);
            paths[1].method.should.be.equal(compareWith[1].method);
            paths[1].action.should.be.equal(compareWith[1].action);
            paths[1].handlerPath.should.be.equal(compareWith[1].handlerPath);
            paths[1].handlerName.should.be.equal(compareWith[1].handlerName);
            paths[1].name.should.be.equal(compareWith[1].name);

            _.isEqual(paths[0], compareWith[0]).should.be.true;
            _.isEqual(paths[1], compareWith[1]).should.be.true;
            done();
        });
    });

    it("independent of number of new lines between @endpoint and function declaration", function(done) {
        var dirname = dir + '/independentSpacesTabs';

        parse(dirname, function(err, paths) {
            if (err) return done(err);
            
            paths.length.should.not.equal(0);

            var compareWith = {
                url: '/books',
                method: 'GET',
                action: 'list',
                handlerPath: dirname + '/default.js',
                handlerName: 'default',
                name: 'name_param',
            };

            paths[0].url.should.be.equal(compareWith.url);
            paths[0].method.should.be.equal(compareWith.method);
            paths[0].action.should.be.equal(compareWith.action);
            paths[0].handlerPath.should.be.equal(compareWith.handlerPath);
            paths[0].handlerName.should.be.equal(compareWith.handlerName);
            paths[0].name.should.be.equal(compareWith.name);

            _.isEqual(paths[0], compareWith).should.be.true;
            done();
        });
    });

    describe("generated by cli", function() {
        it("without name param" ,function(done) {

            var dirname = dir + '/withoutNameParam';
            parse(dirname, function(err, paths) {
                if (err) return done(err);
                
                var compareWith = {
                    url: '/books',
                    method: 'GET',
                    action: 'list',
                    handlerPath: dirname + '/default.js',
                    handlerName: 'default',
                };

                paths[0].url.should.be.equal(compareWith.url);
                paths[0].method.should.be.equal(compareWith.method);
                paths[0].action.should.be.equal(compareWith.action);
                paths[0].handlerPath.should.be.equal(compareWith.handlerPath);
                paths[0].handlerName.should.be.equal(compareWith.handlerName);

                _.isEqual(paths[0], compareWith).should.be.true;
                done();
            });
        });

        it("with name param" ,function(done) {

            var dirname = dir + '/withNameParam';
            parse(dirname, function(err, paths) {
                if (err) return done(err);
                
                var compareWith = {
                    url: '/books',
                    method: 'GET',
                    action: 'list',
                    name: 'name_param',
                    handlerPath: dirname + '/default.js',
                    handlerName: 'default',
                };

                paths[0].url.should.be.equal(compareWith.url);
                paths[0].method.should.be.equal(compareWith.method);
                paths[0].action.should.be.equal(compareWith.action);
                paths[0].handlerPath.should.be.equal(compareWith.handlerPath);
                paths[0].handlerName.should.be.equal(compareWith.handlerName);
                paths[0].name.should.be.equal(compareWith.name);

                _.isEqual(paths[0], compareWith).should.be.true;
                done();
            });
        });
    });
});
