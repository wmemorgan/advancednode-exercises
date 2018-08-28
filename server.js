'use strict';
require('dotenv').load();

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

// user session to store cookies for session, 
//passport for authentication, mongodb for user database
const session = require('express-session')
const passport = require('passport')
const bcrypt = require('bcrypt')
const mongo = require('mongodb').MongoClient

//passport-local for LocalStrategy objects for Local auth,
//mongodb for unique ObjectID objects
const LocalStrategy = require('passport-local')
const ObjectID = require('mongodb').ObjectID

const auth = require('./auth.js')
// const routes = require('./routes.js')
const dbURI = process.env.DBCONNECT

const app = express()

app.set('view engine', 'pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//set up express session with salt from .env
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}))

//set up server to use passport
app.use(passport.initialize())
app.use(passport.session())

// connect to MongoDB (via mLab) only ONCE, start server once connection established
mongo.connect(dbURI, { useNewUrlParser: true }, (err, conn) => {
  const db = conn.db("wme-practicedb")
  if (err) {
    console.log(`Database error: ${err}`)
  } else {
    console.log('Successful database connection')
  }

  auth(app, db)

  // API routes
  app.route('/')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/index',
        {
          title: 'Home page',
          message: 'Please login',
          showLogin: true,
          showRegistration: true,
        }
      )
    })

  app.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/' }),
      (req, res) => {
        console.log('The login req.body contents are: ', req.body)
        res.redirect('/profile')
      })

  // middleware to ensure user is authenticated before displaying profile page
  const ensureAuthenticated = (req, res, next) => {
    // isAuthenticated() via passport
    console.log('req contents are: ', req.isAuthenticated())
    if (req.isAuthenticated()) {
      console.log('Is authenticated')
      return next();
    }
    console.log('Is not authenticated')
    res.redirect('/');
  }
  
  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      console.log('username is: ', req.user)
      res.render(process.cwd() + '/views/pug/profile', { username: req.user.username })
    })

  app.route('/logout')
    .get((req, res) => {
      req.logout()
      res.redirect('/')
    })

  app.route('/register')
    .post((req, res, next) => {
      db.collection('users').findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err);
        } else if (user) {
          console.log('User already exists')
          res.redirect('/');
        } else {
          var hash = bcrypt.hashSync(req.body.password, 12)
          db.collection('users').insertOne(
            {username: req.body.username,
              // password: req.body.password},
              password: hash},
            (err, doc) => {
              if (err) {
                res.redirect('/');
              } else {
                next(null, user);
              }
            }
          )
          console.log(`${req.body.username} created`)
        }
      })
    },
    passport.authenticate('local', { failureRedirect: '/' }),
      (req, res, next) => {
        res.redirect('/profile');
    })
  
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  })
  
  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
  })

})


