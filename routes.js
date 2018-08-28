const passport = require('passport')
const bcrypt = require('bcrypt')

module.exports = function (app, db) { 
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

  // GitHub user authentication    
  app.route('/auth/github/')
    .get(passport.authenticate('github'))

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }),
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
      res.render(process.cwd() + '/views/pug/profile', { username: req.user.profile.displayName })
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
            {
              username: req.body.username,
              // password: req.body.password},
              password: hash
            },
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
}