const passport = require("passport");
const User = require("../models/user");
const LocalStratergy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const express = require("express");
const dotenv = require("dotenv");
const bcryptjs = require("bcryptjs");
const router = express.Router();
// authentication using passport
passport.use(
  new LocalStratergy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    function (req, email, password, done) {
      // find the user and establish the identity
      User.findOne({ email: email }, async function (err, user) {
        if (err) {
          console.log("error in finding the user", err);
          return done(err);
        }
        if (!user) {
          console.log("Invalid UserName or Password");
          return done(null, false);
        }

        // match the Password
        const isPassword = await user.isValidatePassword(password);

        if (!isPassword) {
          console.log("Invalid Username or Password");
          return done(null, false);
        }
        return done(null, user);
      });
    }
  )
);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database using their Google ID
        const user = await User.findOne({ googleId: profile.id });

        if (user) {
          // If the user exists, return the user
          return done(null, user);
        } else {
          // If the user doesn't exist, you can create a new user in the database
          // using the Google profile information or redirect them to a signup page.
          // For simplicity, let's create a new user with the Google profile data here.
          const newUser = {
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          };

          const createdUser = await User.create(newUser);
          return done(null, createdUser);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);
router.get("/success", async (req, res) => {
  const { failure, success } = await googleAuth.registerWithGoogle(userProfile);
  if (failure) console.log("Google user already exist in DB..");
  else console.log("Registering new Google user..");
  res.render("success", { user: userProfile });
});

passport.serializeUser(function (user, done) {
  // For Google OAuth, store the Google ID (string) in the session
  // For local email/password, store the ObjectId in the session
  let serializedId = user.googleId || user._id.toString();
  done(null, serializedId);
});

passport.deserializeUser(function (id, done) {
  // If the ID is a string, assume it's the Google ID
  if (typeof id === "string") {
    User.findOne({ googleId: id }, function (err, user) {
      if (err) {
        console.error("Error in finding user ---> Passport:", err);
        return done(err);
      }
      return done(null, user);
    });
  } else {
    // Otherwise, assume it's the ObjectId for local email/password
    User.findById(id, function (err, user) {
      if (err) {
        console.error("Error in finding user ---> Passport:", err);
        return done(err);
      }
      return done(null, user);
    });
  }
});
// check if user authenticated
passport.checkAuthentication = function (req, res, next) {
  // if the user is signed in, then pass on the request to the next function
  if (req.isAuthenticated()) {
    return next();
  }

  // redirecting the user
  return res.redirect("/");
};

passport.setAuthenticatedUser = function (req, res, next) {
  // if user is authenticated that store the user in req
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
};

module.exports = passport;
