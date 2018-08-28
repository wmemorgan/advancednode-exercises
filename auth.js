const passport = require('passport')
const ObjectID = require('mongodb').ObjectID
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')

module.exports = function (app, db) {  
  //serialization
  //set up function for serialization (user -> key)
  passport.serializeUser((user, done) => {
    console.log('serialize user: ', user)
    done(null, user._id);
  })
  //set up function for deserialization (key -> user)
  passport.deserializeUser((id, done) => {
    console.log('deserialize id: ', id)
    db.collection('users').findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    })
  })

  // password authentication
  passport.use(new LocalStrategy(
    (username, password, done) => {
      db.collection('users').findOne({ username: username }, (err, user) => {
        console.log(`The database name is: `, db.databaseName)
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
        // if (password !== user.password) {
        //   console.log(`Invalid password`)
        //   return done(null, false)
        // }
        console.log('Returning user: ', user)
        return done(null, user)
      })
    })
  )
}