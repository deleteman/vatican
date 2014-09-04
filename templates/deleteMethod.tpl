
var id = req.params.query.id || req.params.url.id || req.params.body.id

this.model.remove({_id: id}, function(err) {
	if(err) return next(err)
	res.send({success: true})
})