module.exports = People;
var peeps = [];
function People() {}
@endpoint (url: /people/cool method: get) 
People.prototype.getCool = function(req, res) {
    res.send(peeps);
}

@endpoint (url: /people/:id method: put)
People.prototype.update = function(req, res) {
    peeps[req.params.url.id] = req.params.body;
    res.send(peeps);
}

@endpoint (url: /people/lame method: get)
People.prototype.getLame = function(req, res) {
    res.send("getting lame peeps")
}

@endpoint (url: /people method: post)
People.prototype.newPeep = function(req, res) {
   peeps.push(req.params.body)
   res.send("thanks, added!");
}

@endpoint (url: /people/:id method: delete)
People.prototype.killPeep = function(req, res) {
    delete peeps[req.params.url.id];
    res.send("dead!");
}

