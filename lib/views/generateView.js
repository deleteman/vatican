
module.exports = function(fname) {
	return {
		render: function() {
			console.log(("File written in: " + fname).green);
		}
	}
}