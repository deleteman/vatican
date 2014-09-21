var data = req.params.body
//...maybe do validation here?
this.model.create(data, function(err, obj) {
	if(err) return next(err)
	res.send(obj)
})
