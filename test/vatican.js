const should = require('should'); //for mocha tests
const Vatican = require("../lib/vatican")
const _ = require('lodash');
const OptionsResponse = require("../lib/optionsresponse")


describe("Vatican methods", function() {

	var vatican = new Vatican({
		handlers: __dirname + '/fixtures/vatican/handlers',
		port: 88
	})
	var matchFound = null

	describe("@checkOptions", function(){ 
		it("should throw an error if no port is specified", function() {
			(function() {
				v = new Vatican({handlers: ''})
			}).should.throw("Port not specified")
		})
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

		it("should return an OptionsResponse with the list of accaptable methods for a URL when method = OPTIONS", () => {
			let ret = vatican.findMethod("/people", 'OPTIONS')
			should(ret).be.instanceOf(OptionsResponse);	
		})

		it("should find the right endpoint based on the version provided in the URL")

		it("should find the right endpoint based on the version provided in the ACCEPT header")

		it("should return the latest version of a URL if no version is provided")

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
