process.env.NODE_ENV = 'test';

var supertest = require('supertest');
var server = require('../server/server');
var assert = require('assert');
var expect = require('expect.js');

var request = supertest(server);

var testData = {};

describe('routes', function() {

  before(function(done){
    server.get('models').sequelize.sync({ force: true}).then(function () {
      done();
    });
  });

  beforeEach(function () {
    testData.req = {
      username: "test",
      password: "password",
      email: "test@test.com",
      profileImageUrl: "http://www.google.com/",
      interests: [],
      description: "Most awesome guy ever",
      status: "online",
      connectedToFacebook: false
    };

    testData.res = {
      username: "test",
      password: null,
      email: "test@test.com",
      profileImageUrl: "http://www.google.com/",
      interests: [],
      description: "Most awesome guy ever",
      status: "online",
      connectedToFacebook: false
    };

    testData.newUser = {
      username: "brandon",
      email: "test@testical.com",
      interests: ['butts', 'butts', 'butts', 'butts', 'butts', 'butts', 'butts', 'butts'],
      description: "Most awesome guy ever bc butts",
      status: "lookin for butts",
      connectedToFacebook: false
    };

    testData.loginValid = {
      username: "test",
      password: "password"
    };

    testData.loginInvalid = {
      username: "brandon",
      password: "butts"
    }



  });

  describe('POST', function() {

    it('should return a new user for POST: /users/signup', function(done) {

      request
        .post('/users/signup')
        .send(testData.req)
        .end(function (err, result) {
          ['id', 'createdAt', 'updatedAt'].forEach(function (property) {
            delete result.body[property];
          });
          assert.deepEqual(result.body, testData.res);
          done();
        });
    });
  });

  describe('GET', function(){
    it('should return user', function(done){
      request
        .get('/users/1')
        .end(function (err, result) {
          ['id', 'createdAt', 'updatedAt'].forEach(function (property) {
            delete result.body[property];
          });
          assert.deepEqual(result.body, testData.res);
          done();
        });
    })
  });

  describe('POST', function(){
    it('should update User', function(done){
      request
        .post('/users/1')
        .send(testData.newUser)
        .end(function (err, result) {
          for(var x in result.body){
            if(testData.newUser[x] === undefined) delete result.body[x];
          }
          assert.deepEqual(result.body, testData.newUser );
          done();
        });
    })
  });  

  describe('POST', function(){
    it('should recieve login error', function(done){
      request
        .post('/users/login')
        .send(testData.loginInvalid)
        .end(function (err, result){
          expect(result.body).to.have.property('error');
          done();
        });
    })
  });

  describe('POST', function(){
    it('should accept new user', function(done){
      request
        .post('/users/signup')
        .send(testData.req)
        .end(function(err, result){done()});
    })
    it('should login new user', function(done){
      request
        .post('/users/login')
        .send(testData.loginValid)
        .end(function (err, result){
          expect(result.body).to.have.property('token');
          done();
        });
    })
  });

});
