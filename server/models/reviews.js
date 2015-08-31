// reviews.js

/*
Some Open Issues:
  - Add additional validation, particularly to make sure star rating is
    between 0 and 5
*/

module.exports = function (sequelize, DataTypes) {
  var Review = sequelize.define('Review', {
    starRating: DataTypes.INTEGER,
    text: DataTypes.TEXT
  });

  return Review;
};
