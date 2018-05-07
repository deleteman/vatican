const should = require('should'); //for mocha tests
const Vatican = require("../lib/vatican")
const _ = require('lodash');
const OptionsResponse = require("../lib/optionsresponse")
const sinon = require("sinon");


describe("Vatican methods", function() {

	var vatican = new Vatican({
		handlers: __dirname + '/fixtures/vatican/handlers',
		port: 88
	})
	var matchFound = null


	describe("@checkOptions", function(){ 
		it("should throw an error if no port is specified", function() {
			(function() {
				let v = new Vatican({handlers: ''})
			}).should.throw("Port not specified")
		})
		it("should throw an error if no handlers folder is specified", function() {
			(function() {
				let v = new Vatican({port: 123})
			}).should.throw("Handlers folder not specified")
		})
		it("should throw an error if you don't define a matching function when you define a custom version format",() => {
			(() => {
				let v = new Vatican({
					handlers: '/no/matching/function',
					port: 88,
					versioning: {
						format: () => { }
					}
				})
			}).should.throw("Versioning error: matching function is needed when format function is provided")
		});
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
			vatican.parseHandlers(function(err, hdlrs) {
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

		it("should return an OptionsResponse with the list of acceptable methods for a URL when method = OPTIONS", () => {
			let ret = vatican.findMethod("/people", 'OPTIONS')
			should(ret).be.instanceOf(OptionsResponse);	
		})

		it("should return an OptionsResponse with the list of acceptable methods for a URL when method = OPTIONS taking into account the version provided", (done) => {
			let localVatican = new Vatican({
				handlers: __dirname + '/fixtures/handlerParser/es6-multi-version',
				port: 88,
				versioning: {
					strategy: "url"
				}
			})
			localVatican.on('READY', () => {
				let res = localVatican.findMethod("/2.1.3/books", "OPTIONS")
				should(res).be.instanceOf(OptionsResponse);
				res.validMethods.split(",").sort().should.eql(['GET', 'POST'].sort());
				done();
			})
		})
		it("should use the full version defined on the annotation if no matching function is defined", (done) => {
			var localVatican = new Vatican({
				handlers: __dirname + '/fixtures/handlerParser/es6-multi-version',
				port: 88,
				versioning: {
					strategy: "url"
				}
			})
			localVatican.on('READY', () => {
				let method = localVatican.findMethod("/2.1.3/books", "GET")
				method.handlerName.should.equal("BooksV2")
				method.name.should.equal("my_list_of_books_2_1_3")
				done();
			})
		})

		it("should find the right endpoint based on the version provided in the URL", (done) => {
			var localVatican = new Vatican({
				handlers: __dirname + '/fixtures/handlerParser/es6-multi-version',
				port: 88,
				versioning: {
					strategy: "url",
					matching: (urlVersion, endpointVersion) => {
						let v = urlVersion.substring(1);
						return +v == +endpointVersion.split(".")[0];
					}
				}
			})
			localVatican.on('READY', () => {
				let method = localVatican.findMethod("/v2/books", "GET")
				method.handlerName.should.equal("BooksV2")
				done();
			})

		})


		it("should find the right endpoint based on the version provided in the ACCEPT header", (done) => {
			var localVatican = new Vatican({
				handlers: __dirname + '/fixtures/handlerParser/es6-multi-version',
				port: 88,
				versioning: {
					strategy: "header",
					matching: (urlVersion, endpointVersion) => {
						let v = urlVersion.substring(1);
						return +v == +endpointVersion.split(".")[0];
					}
				}
			})
			localVatican.on('READY', () => {
				let method = localVatican.findMethod("/books", "GET", {
					"accept": "accept/vnd.vatican-version.v2+json"
				})
				method.handlerName.should.equal("BooksV2")
				done();
			})
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
				let self = this;
				return {
					on: function() {},
					error: function () {},
					once: function(str, cb) {
						console.log("once called with: ", str)
						self.eventEmitter.emit('DB-READY')
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

			sinon.stub(app, 'dbStart');
			app.start();

			( app.server._handle != null ).should.be.true;

			app.close();

			( app.server._handle == null ).should.be.true;
			app.dbStart.restore();
		});

		it('should call callback on close', function( done ) {
			var app = new Vatican({
				handlers: __dirname + '/fixtures/vatican/handlers',
				port: 8888
			})

			sinon.stub(app, 'dbStart');
			app.start();
			app.close(function() {
				app.dbStart.restore();
				done();
			});
		});
	});
})
