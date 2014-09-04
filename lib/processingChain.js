

module.exports = ProcessingChain;


function ProcessingChain( ) {
	this.chain = [];
	this.errorHandlers = [];
}

ProcessingChain.prototype.add = function( proc ) {
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

ProcessingChain.prototype.runChain = function( req, res, finalFn, handler ) {
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
			for(var idx = currentItem; idx < chain.length; idx++) {
				if( (chain[idx].names && chain[idx].names.indexOf(handler.name) != -1) || !chain[idx].names) {
					break
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
		var firstItem = self.findFirstValidItem(handler.name)
		firstItem.fn(req, res, next)
	} else {
		this.chain[0].fn(req, res, next )
	}
};

ProcessingChain.prototype.findFirstValidItem = function(name) {
	if(!name) return this.chain[0]	
	return _.find(this.chain, function(item) { 
		if(item.names && Array.isArray(item.names) && item.names.length > 0) {
			return item.names.indexOf(name) != -1
		} else {
			return true
		}
	})
}
