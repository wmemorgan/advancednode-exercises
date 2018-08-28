const passport = require('passport')
const ObjectID = require('mongodb').ObjectID
const LocalStrategy = require('passport-local').Strategy
const GitHubStrategy = require('passport-github').Strategy
const bcrypt = require('bcrypt')

module.exports = function (app, db) {  
  // //serialization for LocalStrategy
  // //set up function for serialization (user -> key)
  // passport.serializeUser((user, done) => {
  //   console.log('serialize user: ', user)
  //   done(null, user._id);
  // })
  // //set up function for deserialization (key -> user)
  // passport.deserializeUser((id, done) => {
  //   console.log('deserialize id: ', id)
  //   db.collection('users').findOne({ _id: new ObjectID(id) }, (err, doc) => {
  //     done(null, doc);
  //   })
  // })

  //serialization for GitHubStrategy
  // passport.serializeUser((user, done) => {
  //   // console.log('serialize user: ', user)
  //   done(null, user)
  // })

  // passport.deserializeUser((user, done) => {
  //   // console.log('deserialize user: ', user)
  //   done(null, user)
  // })

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    db.collection('socialusers').findOne(
      { id: id },
      (err, doc) => {
        done(null, doc);
      }
    );
  });

  // local password authentication
  // passport.use(new LocalStrategy(
  //   (username, password, done) => {
  //     db.collection('users').findOne({ username: username }, (err, user) => {
  //       console.log(`The database name is: `, db.databaseName)
  //       console.log(`User ${username} attempted to log in.`)
  //       if (err) { return done(err) }
  //       if (!user) {
  //         console.log(`User does not exist`)
  //         return done(null, false)
  //       }
  //       if (!bcrypt.compareSync(password, user.password)) {
  //         console.log(`Invalid password`)
  //         return done(null, false);
  //       }
  //       // if (password !== user.password) {
  //       //   console.log(`Invalid password`)
  //       //   return done(null, false)
  //       // }
  //       console.log('Returning user: ', user)
  //       return done(null, user)
  //     })
  //   })
  // )

  // GitHub authentication
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
    },
    function(accessToken, refreshToken, profile, done) {
      console.log(profile)
      console.log('The profile name: ', profile.displayName)
      db.collection('socialusers').findAndModify(
        { id: profile.id },
        {},
        {
          $setOnInsert: {
            id: profile.id,
            name: profile.displayName ? profile.displayName : 'John Doe',
            photo: profile.photos ? profile.photos[0].value : '',
            email: profile.emails ? profile.emails[0].value : 'No public email',
            created_on: new Date(),
            provider: profile.provider ? profile.provider : ''
          }, $set: {
            last_login: new Date()
          }, $inc: {
            login_count: 1
          }
        },
        { upsert: true, new: true },
        (err, doc) => {
          return done(null, doc.value);
        }
      );
      // done(null, {
      //   accessToken: accessToken,
      //   profile: profile
      // })
    }
  ))



}