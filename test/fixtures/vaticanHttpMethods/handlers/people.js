module.exports = People;
var peeps = [ 'user0', 'user1'];
function People() {}
@endpoint (url: /people method: get) 
People.prototype.getPeople = function(req, res) {
    res.send('get,' + peeps.join(','));
}

@endpoint (url: /people method: post) 
People.prototype.postPeople = function(req, res) {
    res.send('post,' + peeps.join(','));
}

@endpoint (url: /people method: put) 
People.prototype.putPeople = function(req, res) {
    res.send('put,' + peeps.join(','));
}

@endpoint (url: /people method: delete) 
People.prototype.deletePeople = function(req, res) {
    res.send('delete,' + peeps.join(','));
}
