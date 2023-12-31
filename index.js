const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
// const dotenv = require("dotenv");
const port = process.env.PORT || 3000;
const db = require("./config/mongoose");
require("dotenv").config();

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// used for sessions
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("./config/passport");

const MongoStore = require("connect-mongo");

app.use(cookieParser());

// set up view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// mongo-store is used to store session cookies in database
app.use(
  session({
    name: "placement-cell",
    secret: "asewe",
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 100,
    },
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://ParasThakurr:65rqsaGPURtAgzOx@cluster0.thdcaeo.mongodb.net/?retryWrites=true&w=majority",
      autoRemove: "disabled",
    }),
    function(err) {
      console.log(err || "connect-mongodb setup ok");
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// sets the authenticated user in the response
app.use(passport.setAuthenticatedUser);

// using express routers
app.use(require("./routes"));
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));

app.use("/auth", require("./routes/auth"));
app.use(express.static("./assets"));
// using bodyParser
app.use(bodyParser.json());

// listening to the port 8000;
app.listen(port, (err) => {
  if (err) {
    console.log("error in starting the server", err);
    return;
  }
  console.log("server is succesfully running on port 3000");
});
