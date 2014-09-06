var should = require('should'); //for mocha tests
var ProcessingChain = require('../lib/processingChain.js')
var _ = require('lodash');

describe('Processing Chain methods', function() {

	var processingChain = new ProcessingChain()

	var simpleProc = {
		fn: function(req, res, next) {

		},
		names: []
	}
	var errorProc = {
		fn: function(err, req, res, next) {

		}
	}
	describe("@add", function() {
		it("should add a normal function to the right chain", function(done) {
			processingChain.add(simpleProc)
			processingChain.getTotal().should.equal(1)
			done()
		})

		it("should add an error handler to the error chain", function(done) {
			processingChain.add(errorProc)
			processingChain.errorHandlers.length.should.equal(1)
			done()
		})

	})
	describe("@pop", function() {
		it("should correctly remove the last item from the chain", function(done) {
			processingChain.add({fn: true})
			processingChain.getTotal().should.equal(2)
			processingChain.pop()	
			processingChain.getTotal().should.equal(1)
			processingChain.chain[0].should.not.equal(true)
			done()
		})
	})

	describe("@findFirstValidItem", function() {
		it("should correctly find the first valid process when there is no endpoint name set", function() {
			pc = new ProcessingChain()
			pc.add({fn: 1})
			pc.add({fn: 2})
			pc.findFirstValidItem().fn.should.equal(1)
		})

		it("should correctly find the first valid process when there is an endpoint name set", function() {
			pc = new ProcessingChain()
			pc.add({fn: 1, names: ['first']})
			pc.add({fn: 2, names: ['second']})
			pc.findFirstValidItem('first').fn.should.equal(1)
			pc.findFirstValidItem('second').fn.should.equal(2)
		})
	})

	describe("@runChain", function() {
		it("should run the chain correctly", function(done) {
			var result = ""
			pc = new ProcessingChain()
			pc.add({fn: function(req, res, n) {
				result+= "1"
				n()
			}})
			pc.add({fn: function(req, res, n) {
				result+= "2"
				n()
			}})
			pc.add({fn: function(req, res, n) {
				result+= "3"
				n()
			}})
			pc.runChain({}, {}, function() {
				result.should.equal("123")
				done()
			}, null)
		})

		it("should switch to the error chain if there is a problem", function(done) {
			var result = ""
			pc = new ProcessingChain()
			pc.add({fn: function(req, res, n) {
				result+= "1"
				n()
			}})
			pc.add({fn: function(req, res, n) {
				result+= "2"
				n('error')
			}})
			pc.add({fn: function(req, res, n) {
				result+= "3"
				n()
			}})

			pc.add({fn: function(err, req, res, n) {
				result += err
				n()
			}})
			pc.add({fn: function(err, req, res, n) {
				result += 'e2'
				n()
			}})
			pc.runChain({}, {}, function() {
				result.should.equal("12errore2")
				done()
			}, null)		
		})

		it("should run correctly if there are named endpoints involved", function(done) {
			var result = ""
			pc = new ProcessingChain()
			pc.add({fn: function(req, res, n) {
				result+= "1"
				n()
			}})
			pc.add({fn: function(req, res, n) {
				result+= "2"
				n('error')
			}, names: ['endpoint1']})
			pc.add({fn: function(req, res, n) {
				result+= "3"
				n()
			}, names: ['endpoint2']})

			pc.add({fn: function(req, res, n) {
				result += "4"
				n()
			}, names: ["endpoint2", "endpoint1"]})

			pc.runChain({}, {},  function() {
				result.should.equal("134")
				done()
			}, {name: 'endpoint2'})				
		})
	})
})
