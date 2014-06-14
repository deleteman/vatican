

module.exports = ProcessingChain;


function ProcessingChain( ) {
	this.chain = [];
	this.errorHandlers = [];
}

ProcessingChain.prototype.add = function( fn ) {
	if(fn.length == 4) //it's an error handler
		this.errorHandlers.push(fn);
	else
		this.chain.push(fn);
}

ProcessingChain.prototype.runChain = function( req, res, finalFn ) {
	var currentItem = 0;
	var totalItems = this.chain.length;
	var self = this;
	if(totalItems == 0) {
		if(typeof finalFn == 'function') finalFn(req, res);
		return;
	}

	var nextError = function ( err ) {
		if ( currentItem < totalItems - 1 ) {
			currentItem++
			self.errorHandlers[currentItem](err, req, res, nextError)
		} else {
			if(typeof finalFn == 'function') finalFn(req, res);
		}
	}

	var next = function(err) {
		var chain = self.chain;
		if ( err ) { //If there is an error, switch to the error handlers chain
			chain = self.errorHandlers;
			currentItem = -1;
			totalItems = self.errorHandlers.length;
		}
		if ( currentItem < totalItems - 1 ) {
			currentItem++
			if(err) {
				chain[currentItem](err, req, res, nextError)
			} else {
				chain[currentItem](req, res, next)
			}
		} else {
			if(typeof finalFn == 'function') finalFn(req, res);
		}
	}
	this.chain[0](req, res, next )
};
