var should = require('should'); //for mocha tests
var Vatican = require("../lib/vatican")
var _ = require('lodash');


describe("Vatican methods", function() {

	var vatican = new Vatican({
		handlers: __dirname + '/fixtures/vatican/handlers',
		port: 88
	})
	var matchFound = null

	describe("@checkOptions", function(){ 
		var portErrorMessage = "Port must be a number from the range [0, 65535]";

		it("should throw an error if no port is specified", function() {
			(function() {
				v = new Vatican({handlers: ''})
			}).should.throw(portErrorMessage)
		})

		it("should throw an error if port is not a number", function() {
			(function() {
				v = new Vatican({handlers: '', port: '88'})
			}).should.throw(portErrorMessage)
		});

		it("should throw an error if port is a negative number", function() {
			(function() {
				v = new Vatican({handlers: '', port: -1})
			}).should.throw(portErrorMessage)
		});

		it("should throw an error if port is greater than 65535", function() {
			(function() {
				v = new Vatican({handlers: '', port: 65536})
			}).should.throw(portErrorMessage)
		});

		it("should be ok for a port number from range [0, 65536]", function() {
			(function() {
				v = new Vatican({handlers: '', port: 65536})
			}).should.throw(portErrorMessage)
		});



		it("should throw an error if no handlers folder is specified", function() {
			(function() {
				v = new Vatican({port: 123})
			}).should.throw("Handlers folder not specified")
		})
	})

	describe("@preprocess", function() {
		it("should add a processor to the pre-processors chain", function() {
			vatican.preprocess(function(req, res, next) {

			})

			vatican.preprocessors.chain.length.should.equal(1)
		})
	})

	describe("@postprocess", function() {
		it("should add a processor to the post-processors chain", function() {
			vatican.postprocess(function(req, res, next) {

			})

			vatican.postprocessors.chain.length.should.equal(1)		
		})
	})

	describe("@parseHandlers", function() {
		it("should return a structure with the handlers data", function(done) {
			vatican.parseHandlers(function(hdlrs) {
				hdlrs.length.should.equal(5)
				done()
			})
		}) 
	})

	describe("@findMethod", function() {
		it("should find the right method from the paths", function(done) {
			matchFound = vatican.findMethod('/people/123', 'DELETE')
			matchFound.action.should.equal("killPeep")
			matchFound.handlerName.should.equal('People')
			done()
		})
	})

	describe("@getCorrectModel", function() {
		it("should return FALSE if there is no db connection to load models", function(done) {
			vatican.getCorrectModel().should.equal(false)			
			done()
		}) 

		it("should return the correct model if there is one", function(done) {
			var fakeVat = vatican
			fakeVat.__dbStart = function() {
				return {
					on: function() {},
					error: function () {},
					once: function(str, cb) {
						cb()
					}
				}
			}

			fakeVat.dbStart({schemasFolder: __dirname + "/testModels"}, function (err) {
				_.keys(fakeVat.dbmodels).length.should.equal(1);
				done()
			})
		})
	})

	describe("@loadHandler", function() {
		it("should load and return the handler data", function(done) {
			var handler = vatican.loadHandler(matchFound.handlerPath)
			_.keys(vatican.handlers).length.should.equal(1)
			var type = typeof handler == 'function'
			type.should.be.ok
			done()
		})
	})

	describe("@close", function() {
		it('should close server', function() {
			var app = new Vatican({
				handlers: __dirname + '/fixtures/vatican/handlers',
				port: 8888
			})

			app.start();

			( app.server._handle != null ).should.be.true;

			app.close();

			( app.server._handle == null ).should.be.true;
		});

		it('should call callback on close', function( done ) {
			var app = new Vatican({
				handlers: __dirname + '/fixtures/vatican/handlers',
				port: 8888
			})

			app.start();
			app.close(function() {
				done();
			});
		});
	});
})
