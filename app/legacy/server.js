const path = require('path')
const express = require('express')

module.exports = {
  app: function () {
    const app = express();
    const indexPath = path.join(__dirname, 'index.html');
    const publicPath = express.static(path.join(__dirname, '../dist'));

    app.use('/dist', publicPath);
    //app.get('/', function (_, res) { res.sendFile(indexPath) });

    app.get('/*', function(req, res) {
      res.sendFile(indexPath, function(err) {
        if (err) {
          res.status(500).send(err)
        }
      })
    })

    return app;
  }
}