var should = require('should'); //for mocha tests
var Vatican = require("../lib/vatican")
var _ = require('lodash');
var path = require('path');


describe("Vatican methods", function() {

	var vatican = new Vatican(
		__dirname,
		{
			handlers: 'fixtures/vatican/handlers',
			port: 88
		}
	);
	var matchFound = null

	describe("@Vatican constructor", function() {
		//the case new Vatican() without any params I did not analyzed because mocha can't support this case
		it("(context)", function() {
				var context = __dirname + "/fixtures/vatican";
				var v = new Vatican(context);

				v.context.should.be.equal(context);
				v.options.handlers.should.be.equal(context + "/handlers");
				v.options.port.should.be.equal(5000);
		});

		it("(options)", function() {
			var absPath = __dirname + "/fixtures/vatican/handlers";
			var v = new Vatican({ handlers: absPath, port: 88});

			v.context.should.be.equal(process.cwd());
			v.options.handlers.should.be.equal(absPath);
			v.options.port.should.be.equal(88);
		});

		it("(context, options)", function() {
				var context = __dirname + "/fixtures/vatican";
				var absPath = __dirname + "/fixtures/vatican/handlers";
				var v = new Vatican(context, { handlers: absPath, port: 88});

				v.context.should.be.equal(context);
				v.options.handlers.should.be.equal(absPath);
				v.options.port.should.be.equal(88);
		});
	});

	describe("@getContext", function() {
		it("() should return process.cwd()", function() {
			Vatican.prototype.getContext().should.be.equal(process.cwd());
		});

		it("(absPath) should return absPath", function() {
			var absPath = process.cwd();
			Vatican.prototype.getContext(absPath).should.be.equal(absPath);
		});

		it("(relPath) should throw error", function() {
			(function(){
				var v = new Vatican("./ok");
			}).should.throw("Context specified specified is not an absolute path");
		});

		it("(notDir) should throw error", function() {
			(function(){
				var v = new Vatican(path.resolve(process.cwd(), "wrong_file.txt"));
			}).should.throw("Context specified can not be treated as directory");
		});
	});

	describe("@checkOptions", function(){ 
		it("should throw an error if no port is specified", function() {
			(function() {
				var v = new Vatican({handlers: ''})
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
			var app = new Vatican(
				__dirname,
				{
					handlers: 'fixtures/vatican/handlers',
					port: 8888
				}
			);

			app.start();

			( app.server._handle != null ).should.be.true;

			app.close();

			( app.server._handle == null ).should.be.true;
		});

		it('should call callback on close', function( done ) {
			var app = new Vatican(
				__dirname, 
				{
					handlers: __dirname + '/fixtures/vatican/handlers',
					port: 8888
				}
			);

			app.start();
			app.close(function() {
				done();
			});
		});
	});
})
