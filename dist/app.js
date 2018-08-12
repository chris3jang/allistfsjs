
const Server = require('./server.js')
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')
const db = require('./config/db');
const port = (process.env.PORT || 8080)
const app = Server.app()

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const express = require('express')
const router = express.Router()

const bcrypt = require('bcrypt')


function localReg(un, pw) {
  MongoClient.connect(db.url, (err, database) => {
    db.collection('localusers').findOne({username: un})
    .then(result => {
      if(null != result) {
        return console.log("USERNAME ALREADY EXISTS: ", result.username)
      }
      else {
        const hash = bcrypt.hashSync(pw, 8)
        const newUser = {
          username: un,
          password: pw
        }
        console.log("CREATING USER: ", un)
        return db.collection('localusers').insert(newUser, (err, inserted)=> {
          db.close()
        })
      }
    })
  })
}

function localAuth(un, pw) {
  MongoClient.connect(db.url, (err, database) => {
    db.collection('localusers').findOne({username: un})
    .then(result => {
      if(null == result) {
        console.log("USERNAME NOT FOUND: ", un)
      }
      else {
        const hash = result.password
        console.log("FOUND USER:  " + result.username)
        if(bycrpt.compareSync(pw, hash)) {
          db.close()
          return result
        }
        else {
          console.log("AUTH FAILED")
          db.close()
        }
      }
    })
  })
}




/*
passport.use(new LocalStrategy(
  { passReqToCallback: true},
  (username, password, done) => {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    });
  }
));
*/




/*
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
*/

passport.use('login', new LocalStrategy(
  {passReqToCallback : true}, 
  (req, username, password, done) => {

    console.log(username, password, localAuth(username, password))
    this.localAuth(username, password)
    .then(user => {
      if (user) {
        console.log("LOGGED IN AS: " + user.username)
        req.session.success = 'You are successfully logged in ' + user.username + '!'
        done(null, user)
      }
      if (!user) {
        console.log("COULD NOT LOG IN")
        req.session.error = 'Could not log user in. Please try again.'
        done(null, user)
      }
    })
    .fail(function (err){
      console.log(err.body)
    })
  }
))


passport.use('register', new LocalStrategy(
  {passReqToCallback: true},
  (req, username, password, done) => {
    localReg(username, password)
    .then(user => {
      if(user) {
        console.log("REGISTERED: " + user.username)
        req.session.success = 'You are successfully registered and logged in ' + user.username + '!'
        done(null, user)
      }
      if(!user) {
        console.log("COULD NOT REGISTER")
        req.session.error = 'That username is already in use, please try a different one.'
        done(null, user)
      }
    })
    .fail(err => {
      console.log(err.body)
    })
  }
))

passport.serializeUser((user, done) => {
  console.log("serializing " + user.username)
  done(null, user)
})

passport.deserializeUser((obj, done) => {
  console.log("deserializing " + obj)
  done(null, obj)
})


//************************************************************************************s




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

/*

app.use(session({
  genid: function(req) {
    return '_' + Math.random().toString(36).substr(2, 9)
  },
  secret: 'theycutthefleeb', resave: false, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

*/

/*
passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (!user.validPassword(password)) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user)
  })

}))
*/

MongoClient.connect(db.url, (err, database) => {

  if (err) return console.log(err);
  app.use(bodyParser.urlencoded({ extended: true }));
  //app.use(bodyParser.json());
  require('./routes')(app, database.db("nodjsapitutdb"));

  app.listen(port, () => {
    console.log('We are live on http://localhost:' + port);
  });               
})


//app.listen(port, 
//console.log(`Listening at http://localhost:${port}`))