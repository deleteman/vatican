'use strict'

class OptionsResponse {


	constructor(validMethods) {
		this.validMethods = validMethods;
		this.name = "OptionsResponse";
	}

	action(req, res, next) {
		res.setHeader(["Allow", this.validMethods]);
		next();
	}
}

module.exports = OptionsResponse;