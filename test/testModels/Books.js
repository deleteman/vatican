
module.exports = function(mongoose) {
	var Schema = mongoose.Schema


	var SchemaObj = new Schema({
		title: String,
	isbn: String,
	author: { type: Schema.Types.ObjectId, ref: 'Author' }
	})

	return mongoose.model('Books', SchemaObj)
}