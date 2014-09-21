module.exports = People;
function People() {}
@endpoint (url: /people method: get) 
People.prototype.getPeople = function(req, res) {
    res.send('ok');
}
