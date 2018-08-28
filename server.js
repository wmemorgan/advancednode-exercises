'use strict';
require('dotenv').load();

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');

// user session to store cookies for session, 
//passport for authentication, mongodb for user database
const session = require('express-session')
const passport = require('passport')
const mongo = require('mongodb').MongoClient
const GitHubStrategy = require('passport-github').Strategy

// user authentication module
const auth = require('./auth.js')
// routing module
const routes = require('./routes.js')

const dbURI = process.env.DBCONNECT
const app = express()

app.set('view engine', 'pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connect to MongoDB (via mLab) only ONCE, start server once connection established
mongo.connect(dbURI, { useNewUrlParser: true }, (err, conn) => {
  const db = conn.db("wme-practicedb")
  if (err) {
    console.log(`Database error: ${err}`)
  } else {
    console.log('Successful database connection')
  }

  //set up express session with salt from .env
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  }))

  //set up server to use passport
  app.use(passport.initialize())
  app.use(passport.session())

  //serialization for GitHubStrategy
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

  // GitHub authentication
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  },
    (accessToken, refreshToken, profile, done) => {
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

  // GitHub user authentication    
  app.route('/auth/github')
    .get(passport.authenticate('github'))

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }),
      (req, res) => {
        console.log('The login req.body contents are: ', req.body)
        res.redirect('/profile')
      })

  //GitHubStrategy login    
  app.route('/login')
    .post(passport.authenticate('github', { failureRedirect: '/' }),
      (req, res) => {
        console.log('The login req.body contents are: ', req.body)
        res.redirect('/profile')
      })

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

  app.route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      console.log('username is: ', req.user)
      res.render(process.cwd() + '/views/pug/profile', { username: req.user.name })
    })

  app.route('/logout')
    .get((req, res) => {
      req.logout()
      res.redirect('/')
    })

 //Handle missing pages
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  })
  
  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
  })

})


