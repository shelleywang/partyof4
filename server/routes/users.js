// users.js
var userController = require('../controllers/users');

module.exports = function(app) {
  app.post('/users/signup', userController.signup);
  app.post('/user/login', userController.login);
  app.get('/user/logout', userController.logout);

  app.get('/user/:id', userController.getUser);
  app.post('/user/:id', userController.updateUser);

  app.get('/users/:id/reviews', userController.getReviews);
  app.post('/users/:id/reviews', userController.postReview);


  app.get('/users/:id/history', userController.getHistory);
  app.post('/users/:id/history', userController.updateHistory);

};