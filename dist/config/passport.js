const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user._id);
})

passport.deserializeUser((id, done) => {
  console.log("id: ", id)
  User.findOne({_id: id}, (err, user) => {
    done(err, user);
  });
});

passport.use('login', new LocalStrategy(
  { passReqToCallback: true},
  (username, password, done) => {
    User.findOne({ username: username }, function (err, user) {
      if (err) { 
        return done(err); 
      }
      return done(null, user);
    });
  }
));