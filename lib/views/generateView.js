
module.exports = function(files) {
	return {
		render: function() {
			files.forEach(function(fname) {
				console.log(("File written in: " + fname).green);
			})
		}
	}
}