process.env.NODE_ENV = 'test';

var supertest = require('supertest'),
    server    = require('../server/server'),
    assert    = require('assert'),
    expect    = require('expect.js'),
    utils     = require('./testUtils.js');

var request = supertest(server);

var req;
var expectedResponse;


describe('Events routes: ', function() {

  beforeEach(function () {
    req = {
      hostId: 1,
      locationId: 1,
      plannedTime: (new Date(2015, 8, 2, 19, 30)).toISOString(),
      capacity: 10,
      currentSize: 4,
      currentActivity: 'Ordering',
      completedStatus: false
    };

    expectedResponse = {};
    for (var key in req) {
      expectedResponse[key] = req[key];
    }
  });

  describe('POST to /events', function() {

    it('should return a 201 status code and respond with the created event', function (done) {
      utils.logIn(function(result, accessToken) {
        request
          .post('/events?accessToken='+accessToken)
          .send(req)
          .end(function (err, actualResponse) {          
            ['id', 'createdAt', 'updatedAt'].forEach(function (property) {
              delete actualResponse.body[property];
            });

            assert.equal(actualResponse.status, 201);
            assert.deepEqual(actualResponse.body, expectedResponse);
            done();
          });
      }, 1);
    });

    it('should not let you make events for other users', function (done) {
      utils.logIn(function(result, accessToken) {
        request
          .post('/events?accessToken='+accessToken)
          .send(req)
          .expect(403, done);
      }, 2);
    });
  });

  describe('GET to /events', function () {
    it('should return nearby events', function (done) {
      request
        .get('/events?latitude='+utils.coordinates.latitude+'&longitude='+utils.coordinates.longitude)
        .end(function (err, actualResponse) {
          ['id', 'createdAt', 'updatedAt', 'Location', 'distance'].forEach(function (property) {
            delete actualResponse.body[0][property];
          });

          expect(actualResponse.body[0]).to.have.property('locationId')
          done();
        });
    });

    it ('should not return a 200 status code when latitude and longitude are missing or invalid', function(done) {
      request
        .get('/events')
        .expect(400);

            request
        .get('/events?latitude=1000&longitude=-1000')
        .expect(400, done);
    });

    describe('/:eventId', function () {
      it('should return an existing event', function (done) {
        request
          .get('/events/1')
          .end(function (err, actualResponse) {
            ['id', 'createdAt', 'updatedAt', 'Users', 'Location', 'host'].forEach(function (property) {
              delete actualResponse.body[property];
            });

            assert.deepEqual(actualResponse.body, expectedResponse);
            done();
          });
      });

      it('should not return an nonexistent event', function (done) {
        request
          .get('/events/2')
          .end(function (err, actualResponse) {
            assert.deepEqual(actualResponse.body, {});
            done();
          });
      });
    });
  });

  describe('PUT to /events/:eventId', function() {

    it('should return a 200 status code', function (done) {

      req.currentActivity = 'Eating';
      utils.logIn(function(result, accessToken) {
        request
          .put('/events/1?accessToken='+accessToken)
          .send(req)
          .end(function (err, actualResponse) {          
            assert.equal(actualResponse.status, 200);
            done();
          });
      }, 1);
    });

    it('should modify the event in the database', function (done) {
      utils.logIn(function(result, accessToken) {
        request
          .get('/events/1?accessToken='+accessToken)
          .end(function (err, actualResponse) {          
            ['id', 'createdAt', 'updatedAt', 'Location', 'Users', 'host'].forEach(function (property) {
              delete actualResponse.body[property];
            });

            assert.notDeepEqual(actualResponse.body, expectedResponse);
            expectedResponse.currentActivity = 'Eating';
            assert.deepEqual(actualResponse.body, expectedResponse);
            done();
          });
        }, 1);
    });

    it('should not modify the event in the database if user is not the host', function (done) {
      utils.logIn(function(result, accessToken) {
        request
          .put('/events/1?accessToken='+accessToken)
          .send({currentActivity: 'Waiting'})
          .expect(403, done);
        }, 2);
    });
  });

  describe('should allow users to join events', function() {
    it('should allow users to request to join events', function(done) {
      utils.logIn(function(result, accessToken) {
        request
          .post('/events/1/join?accessToken='+accessToken)
          .end(function(err, actualResponse) {
            assert.equal(actualResponse.body.UserId, 3);
            done();
          });
      }, 2);
    });

    it('should allow hosts to approve users of their events', function(done) {
      utils.logIn(function(result, accessToken) {
        var requestbody = {user: 3, approved: true};
        request
          .put('/events/1/approve?accessToken='+accessToken)
          .send(requestbody)
          .expect(200, done);
      }, 1);
    });

    it('should not allow non-hosts to approve users', function(done) {
      utils.logIn(function(result, accessToken) {
        var requestbody = {user: 3, approved: true};
        request
          .put('/events/1/approve?accessToken='+accessToken)
          .send(requestbody)
          .expect(403, done);
      }, 0);
    });

    it('should allow users to change their status messages', function(done) {
      utils.logIn(function(result, accessToken) {
        var requestbody = {status: 'walking over'};
        request
          .put('/events/1/status?accessToken='+accessToken)
          .send(requestbody)
          .expect(200, done);
      }, 1);
    });

    it('should return a 400 if you are not a member of an event and trying to update status', function(done) {
      utils.logIn(function(result, accessToken) {
        var requestbody = {status: 'much status'};
        request
          .put('/events/1/status?accessToken='+accessToken)
          .send(requestbody)
          .expect(400, done);
      }, 0);
    });

  });

});
