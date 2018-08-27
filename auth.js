const passport = require('passport')
const ObjectID = require('mongodb')
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local')

module.exports = function (app, db) {  
  passport.serializeUser((user, done) => {
    console.log('serialize user: ', user)
    done(null, user._id);
  })

  passport.deserializeUser((id, done) => {
    console.log('deserialize id: ', id)
    db.collection('users').findOne(
      { _id: new ObjectID(id) },
      (err, doc) => {
        done(null, doc);
      }
    )
  })

  passport.use(new LocalStrategy(
    function (username, password, done) {
      db.collection('users').findOne({ username: username }, function (err, user) {
        console.log(`The database is: ${process.env.DBCONNECT}`)
        console.log(`User ${username} attempted to log in.`)
        if (err) { return done(err) }
        if (!user) {
          console.log(`User does not exist`)
          return done(null, false)
        }
        if (!bcrypt.compareSync(password, user.password)) {
          console.log(`Invalid password`)
          return done(null, false);
        }
        //  if (password !== user.password) {
        //    // console.log(`We've got a match with ${user.username} and ${username} we're golden`)
        //    return done(null, false) 
        //  }
        console.log('Returning user: ', user)
        return done(null, user)
      })
    })
  )

}