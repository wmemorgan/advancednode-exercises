'use strict';
require('dotenv').load();

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const pug = require('pug')
const mongo = require('mongodb').MongoClient
const bcrypt = require('bcrypt');

const auth = require('./auth')
const routes = require('./routes')

const dbURI = process.env.DBCONNECT
const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')


// app.use(passport.session())


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

  auth(app, db)

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


