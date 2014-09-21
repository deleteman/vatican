var should = require('should'),
    vatican = require('../'),
    request = require('supertest');

describe('vatican configuration', function() {
    it('handlers must support a relative path', function( done ) {
        var app = new vatican({
            'handlers': 'fixtures/vaticanConfig/handlers',
            'port': 24000,
        });

        app.start();

        request('http://localhost:24000')
            .get('/people')
            .expect(200)
            .expect('ok')
            .end(function(err) {
                ( err == undefined ).should.be.true;
                app.close();
                done();
            });
    });

    it('handlers must support a absolute path', function( done ) {
        var app = new vatican({
            'handlers': __dirname + '/fixtures/vaticanConfig/handlers',
            'port': 24000,
        });

        app.start();

        request('http://localhost:24000')
            .get('/people')
            .expect(200)
            .expect('ok')
            .end(function(err) {
                ( err == undefined ).should.be.true;
                app.close();
                done();
            });
    });
});
