const itemRoutes = require('./routes');

module.exports = function(app, db) {
  itemRoutes(app, db);
  // Other route groups could go here, in the future
};