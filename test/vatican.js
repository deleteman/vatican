var should = require('should'); //for mocha tests
var Vatican = require("../lib/vatican")
var _ = require('lodash');


describe("Vatican methods", function() {

	var vatican = new Vatican({
		handlers: __dirname + '/fixtures/vatican/handlers',
		port: 88
	})
	var matchFound = null

	describe("@checkOpptions", function(){ 
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
})
