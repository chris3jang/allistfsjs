const itemRoutes = require('./routes');

module.exports = function(app, db) {
  itemRoutes(app, db);
};