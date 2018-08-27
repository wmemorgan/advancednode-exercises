'use strict';
require('dotenv').load();

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const pug = require('pug')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const mongo = require('mongodb').MongoClient
const ObjectID = require('mongodb')
const bcrypt = require('bcrypt');

const routes = require('./routes.js')

const dbURI = process.env.DBCONNECT
const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true, 
}))
app.use(passport.initialize())
app.use(passport.session())


// Enable to pass the challenge called "Advanced Node and Express - 
// Registration of New Users"
// if (process.env.ENABLE_DELAYS) app.use((req, res, next) => {
//   switch (req.method) {
//     case 'GET':
//       switch (req.url) {
//         case '/logout': return setTimeout(() => next(), 500);
//         case '/profile': return setTimeout(() => next(), 700);
//         default: next();
//       }
//     break;
//     case 'POST':
//       switch (req.url) {
//         case '/login': return setTimeout(() => next(), 900);
//         default: next();
//       }
//     break;
//     default: next();
//   }
// });

mongo.connect(dbURI, { useNewUrlParser: true }, (err, conn) => {
  const db = conn.db("wme-practicedb")
  if (err) {
    console.log(`Database error: ${err}`)
  } else {
    console.log('Successful database connection')
  }
  
  passport.serializeUser((user, done) => {
     done(null, user._id);
   });

  passport.deserializeUser((id, done) => {
    db.collection('users').findOne(
        {_id: new ObjectID(id)},
        (err, doc) => {
            done(null, doc);
        }
      )
    })
  
  passport.use(new LocalStrategy(
    function(username, password, done) {
     db.collection('users').findOne({ username: username }, function(err, user) {
       console.log(`The database is: ${process.env.DBCONNECT}`)
       console.log(`The 'user' is: {${user.username}, ${user.password}}`)
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
       return done(null, user)
     }) 
    })
  )

  routes(app, db)
  
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  })
  
  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
  })

})


