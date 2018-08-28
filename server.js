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

  //Authenticate users
  auth(app, db)
 //Initialize server routes
  routes(app, db)
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


