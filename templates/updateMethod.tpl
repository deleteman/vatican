
var id = req.params.query.id || req.params.url.id || req.params.body.id
var data = req.params.body


this.model.update({_id: id}, {$set: data}, function(err, affected) {
	if(err) return next(err)
	res.send({success: true, affected_documents: affected})
})