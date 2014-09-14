var _ = require("lodash")

module.exports = ProcessingChain;


function ProcessingChain( ) {
	this.chain = [];
	this.errorHandlers = [];
}

ProcessingChain.prototype.add = function( proc ) {
	proc.names =  proc.names ? 
						( Array.isArray(proc.names) ? proc.names : Array(proc.names) )  
						: [];
	if(proc.fn.length == 4) //it's an error handler
		this.errorHandlers.push(proc);
	else
		this.chain.push(proc);
}

ProcessingChain.prototype.getTotal = function() {
	return this.chain.length;
};

ProcessingChain.prototype.pop = function() {
	this.chain.pop();
}

ProcessingChain.prototype.runChain = function( params ) { 
	params = params || {};
	var req = params.req;
	var res = params.res;
	var finalFn = params.finalFn;
	var handler = params.handler;
	var endPrep = params.endPrep || []; //last preprocessor

	var currentItem = 0;
	var chain = [].concat(this.chain, endPrep);
	var totalItems = chain.length;
	var self = this;
	if(totalItems == 0) {
		if(typeof finalFn == 'function') finalFn(req, res);
		return;
	}

	var nextError = function ( err ) {
		if ( currentItem < totalItems - 1 ) {
			currentItem++
			self.errorHandlers[currentItem].fn(err, req, res, nextError)
		} else {
			if(typeof finalFn == 'function') finalFn(req, res);
		}
	}

	var next = function(err) {
		//chain is taken from the closure
		if ( err ) { //If there is an error, switch to the error handlers chain
			chain = self.errorHandlers;
			currentItem = -1;
			totalItems = self.errorHandlers.length;
		}
		if ( currentItem < totalItems - 1 ) {
			var idx = ++currentItem;

			if( handler && handler.name) {
				for(; idx < chain.length; idx++) {
					if( !chain[idx].names || ( ! chain[idx].names.length ) || ~chain[idx].names.indexOf(handler.name)) {
						break
					}
				}
			} 

			currentItem = idx
			if(err) {
				chain[currentItem].fn(err, req, res, nextError)
			} else {
				chain[currentItem].fn(req, res, next)
			}
		} else {
			if(typeof finalFn == 'function') finalFn(req, res);
		}
	}
	if(handler) {
		var firstItem = self.findFirstValidItem(handler.name, chain)
		firstItem.fn(req, res, next)
	} else {
		chain[0].fn(req, res, next )
	}
};

ProcessingChain.prototype.findFirstValidItem = function(name, chain) {
	if(!name) return chain[0]	
	return _.find(chain, function(item) { 
		if(item.names && Array.isArray(item.names) && item.names.length > 0) {
			return item.names.indexOf(name) != -1
		} else {
			return true
		}
	})
}
