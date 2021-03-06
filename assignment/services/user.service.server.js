var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var bcrypt = require("bcrypt-nodejs");


module.exports = function (app) {

  var userModel = require("../model/user/user.model.server");

  var facebookConfig = {
    clientID     : '580047185688152',
    clientSecret : '273149878d88693e7babef94d12af08a',
    callbackURL  : 'https://cs5610-webdev-shua.herokuapp.com/auth/facebook/callback'
  };

  app.put("/api/user/:userId", updateUser);
  app.get("/api/user/:userId", findUserById);
  app.get("/api/user/:username", findUserByUsername);
  app.get("/api/user", findUserByCredentials);
  // app.get("/api/user", findUser);
  app.post("/api/user", createUser);
  app.delete("/api/user/:userId", deleteUser);
  //authentication api
  app.post('/api/login', passport.authenticate('local'), login);
  app.post('/api/logout', logout);
  app.post('/api/register', register);
  app.post ('/api/loggedIn', loggedIn);

  // auth with Facebook
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/user',
      failureRedirect: '/login'
    }));
  app.get ('/facebook/login', passport.authenticate('facebook', { scope : ['email'] }));

  // passport config
  passport.use(new LocalStrategy(localStrategy));
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
  passport.use(new FacebookStrategy(facebookConfig, facebookStrategy));



  function localStrategy(username, password, done) {
    userModel.findUserByUsername(username).then(
        function (user) {
          if (user && bcrypt.compareSync(password, user.password)) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        },
        function (err) {
          if (err) {
            return done(err);
          }
        });
  }

  function facebookStrategy(token, refreshToken, profile, done) {
    userModel.findFacebookId(profile.id).then(
        function(user) {
          if(user) {
            return done(null, user);
          } else {
            var names = profile.displayName.split(" ");
            var newFacebookUser = {
              username: 'username',
              password: 'password',
              lastName:  names[1],
              firstName: names[0],
              email:     profile.emails ? profile.emails[0].value:"",
              facebook: {
                id:    profile.id,
                token: token
              }
            };
            return userModel.createUser(newFacebookUser);
          }
        },
        function(err) {
          if (err) { return done(err); }
        }
      )
      .then(
        function(user){
          return done(null, user);
        },
        function(err){
          if (err) { return done(err); }
        }
      );
  }

  function serializeUser(user, done) {
    done(null, user);
  }

  function deserializeUser(user, done) {
    userModel.findUserById(user._id).then(
        function(user){
          done(null, user);
        },
        function(err){
          done(err, null);
        }
      );
  }




  function loggedIn(req, res) {
    res.json(req.isAuthenticated() ? req.user : '0');
  }

  function login(req, res) {
    var user = req.user;
    res.json(user);
  }

  function logout(req, res) {
    req.logout();
    res.send(200);
  }

  function register(req, res) {
    var newUser = req.body;
    newUser.password = bcrypt.hashSync(newUser.password);
    userModel.findUserByUsername(newUser.username).then(
      function (user) {
        if (user) {
          res.sendStatus(400).json("Username is in use!");
          return;
        } else {
          userModel.createUser(newUser).then(
            function (user) {
              if (user) {
                req.login(user, function (err) {
                  if (err) {
                    res.sendStatus(400).send(err);
                  } else {
                    res.json(user);
                  }
                });
              }
            }
          )
        }
      }
    )
  }





  function deleteUser(req, res) {
    var userId = req.params["userId"];
    userModel.deleteUser(userId).then(
      function(stats) {
        res.json(stats);
      },
      function(err) {
        res.sendStatus(404).send(err);
      });
  }

  function createUser(req, res) {
    var user = req.body;
    console.log(user);
    userModel.createUser(user).then(
      function(user) {
        if (user) {
          res.json(user);
        } else {
          res.sendStatus(400).send('0');
        }
      },
      function (err) {
        res.statusCode(400).send(err);
      }
    );
  }

  function findUserByUsername(req, res) {
    var username = req.params["username"];
    userModel.findUserByUsername(username).then(
      function (user) {
        if (user) {
          res.json(user);
        } else {
          res.sendStatus(400).send('0');
        }
      },
      function (err) {
        res.statusCode(404).send(err);
      }
      );
  }

  function findUserById(req, res) {
    var userId = req.params["userId"];
    userModel.findUserById(userId).then(
      function(user) {
        if (user) {
          res.json(user);
        } else {
          res.sendStatus(400).send('0');
        }
      },
      function(err) {
        res.sendStatus(404).send(err);
      }
    );

  }

  function findUserByCredentials(req, res) {
    var username = req.query["username"];
    var password = req.query["password"];
    userModel.findUserByCredentials(username, password).then(
      function(user) {
        if (user) {
          res.json(user);
        } else {
          res.sendStatus(400).send('0');
        }
      },
      function(err) {
        res.sendStatus(400).send(err);
      }
    );
  }

  function findUser(req, res) {
    var username = req.query["username"];
    var password = req.query["password"];
    // var user = null;
    if (username && password) {
      var promise = userModel.findUserByCredentials(username, password);
      promise.then(function(user){
        if (user) {
          res.json(user);
        } else {
          res.sendStatus(400).send('0');
        }
      });
      return;
    } else if (username) {
      userModel.findUserByUsername(username).then(function(user) {
        if (user) {
          res.json(user);
        } else {
          res.sendStatus(400).send('0');
        }
      });
      return;
    }
    res.json(users);
  }

  function updateUser(req, res) {
    var userId = req.params["userId"];
    var user = req.body;
    userModel.updateUser(userId, user).then(
      function(user) {
        if (user) {
          res.json(user);
        } else {
          res.sendStatus(400).send('0');
        }
      },
      function (err) {
        res.statusCode(404).send(error);
      });
  }
}




