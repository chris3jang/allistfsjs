
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

//const MongoStore = require('connect-mongo')(session)



function localReg(un, pw) {
  console.log("localReg function")
  return new Promise((resolve, reject) =>  {
    MongoClient.connect(db.url, (err, database) => {
      database.db("nodjsapitutdb").collection('localusers').findOne({username: un})
      .then(result => {
        if(null != result) {
          return console.log("USERNAME ALREADY EXISTS: ", result.username)
          resolve(false)
          database.close()
          return
        }
        else {
          const hash = bcrypt.hashSync(pw, 8)
          console.log(hash)
          const newUser = {
            username: un,
            password: hash
          }
          console.log("CREATING USER: ", un)
          database.db("nodjsapitutdb").collection('localusers').insert(newUser)
          .then(inserted => {
            resolve(newUser)
            console.log("post resolve")
            database.close()
            return
          })
        }
      })
    })
  })
}

function localAuth(un, pw) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(db.url, (err, database) => {
      database.db("nodjsapitutdb").collection('localusers').findOne({username: un})
      .then(result => {
        if(null == result) {
          console.log("USERNAME NOT FOUND: ", un)
          resolve(false)
          database.close()
          return
        }
        else {
          const hash = result.password
          console.log("result.password", result.password, result)
          console.log("FOUND USER:  " + result.username)
          console.log(bcrypt.compareSync(pw, hash))
          if(bcrypt.compareSync(pw, hash)) {
            database.close()
            resolve(result)
            return
          }
          else {
            reject(new Error("AUTH FAILED LOCALAUTH PROMISE REJECT"))
            console.log("AUTH FAILED")
            database.close()
            return
          }
        }
      })
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
    localAuth(username, password)
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
    .catch(function (err){
      console.log(err.body)
    })
  }
))


passport.use('register', new LocalStrategy(
  {passReqToCallback: true},
  (req, username, password, done) => {
    localReg(username, password)
    .then(user => {
      console.log(user)
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
    .catch(err => {
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


app.use(session({secret: 'theycutthefleeb', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});



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
  app.use(bodyParser.json())
  require('./routes')(app, database.db("nodjsapitutdb"));


  app.listen(port, () => {
    console.log('We are live on http://localhost:' + port);
  });               
})

//store: new MongoStore({db: database.db("nodjsapitutdb")})
//app.listen(port, 
//console.log(`Listening at http://localhost:${port}`))