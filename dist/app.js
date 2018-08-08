
const Server = require('./server.js')
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')
const db = require('./config/db');
const port = (process.env.PORT || 8080)
const app = Server.app()

const session = require('express-session')
const passport = require('passport')

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack')
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpackHotMiddleware = require('webpack-hot-middleware')
  const config = require('../webpack.config.js')
  //const config = require('../webpack.deployment.config.js')
  const compiler = webpack(config)

  app.use(webpackHotMiddleware(compiler))
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPathdist
  }))
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({secret: 'theycutthefleeb'}))
app.use(passport.initialize())
app.use(passport.session())

MongoClient.connect(db.url, (err, database) => {
  if (err) return console.log(err);
  app.use(bodyParser.urlencoded({ extended: true }));
  //app.use(bodyParser.json());
  require('./routes')(app, database.db("nodjsapitutdb"), database.db("admin"));

  app.listen(port, () => {
    console.log('We are live on http://localhost:' + port);
  });               
})


//app.listen(port, 
//console.log(`Listening at http://localhost:${port}`))