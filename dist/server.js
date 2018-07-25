
const path = require('path')
const express = require('express')
//const MongoClient = require('mongodb').MongoClient
//const bodyParser = require('body-parser')

module.exports = {
  app: function () {
    const app = express();
    const indexPath = path.join(__dirname, 'indexDep.html');
    const publicPath = express.static(path.join(__dirname, '../dist'));

    app.use('/dist', publicPath);
    app.get('/', function (_, res) { res.sendFile(indexPath) });

    //app.use(bodyParser.urlencoded({ extended: true }));


    return app;
  }
}