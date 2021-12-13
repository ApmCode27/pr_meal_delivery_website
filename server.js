var express = require("express");
var app = express();
const path = require("path");
const exphbs = require("express-handlebars");
const Sequelize = require("sequelize");
const clientSessions = require("client-sessions");

var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// instruct the app to use the "express.urlencoded" middleware
app.use(express.urlencoded({ extended: true }));

//2 Create a middleware function to setup client-sessions.
// instruct the app to use express handlebars for the view engine with the .hbs extension
// Register handlerbars as the rendering engine for views
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

// Setup the static folder that static resources can load from
// like images, css files, etc.
app.use(express.static("views"));

app.use(express.static("static"));
// important
// Setup client-sessions
app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 1 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);
// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
//---------------------------------------------------------------

// Connection to data base

const sequelize = new Sequelize(
  "d7cslq1fbjg7ou",
  "zakhtaauvhdwov",
  "74f631f2edca9c8f683cd670891a71be96ed5d1c62d0f72b42c8ba8893c49d2d",
  {
    host: "ec2-34-228-100-83.compute-1.amazonaws.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

//-DEFINING MODELS ------------------------------>
// Define our Models - "Registration"
const Userprofile = sequelize.define("Userprofile", {
  // name, username, email, password, photo
  name: Sequelize.STRING,
  username: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  usertype: Sequelize.STRING,
});

var Package = sequelize.define("Package", {
  // name, username, email, password, photo
  packagename: Sequelize.STRING,
  packageprice: Sequelize.STRING,
  description: Sequelize.STRING,
  pfoodcategory: Sequelize.STRING,
  numberof: Sequelize.STRING,
});

const Clerk = sequelize.define("Clerk", {
  // name, username, email, password, photo
  name: Sequelize.STRING,
  username: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING,
});

//--------------------------------------------------

// REGISTER  && CLERK--------------------------------------->

app.get("/register", (req, res) => {
  // fetch all of the names and order them by id
  Userprofile.findAll({
    order: ["id"],
  }).then((data) => {
    // render the "viewTable" view with the data
    res.render("register", {
      data: data,
      layout: false, // do not use the default Layout (main.hbs)
    });
  });
});

app.post("/addUser", (req, res) => {
  // name, username, email, password, photo

  Userprofile.create({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    usertype: req.body.usertype,
  }).then(() => {
    console.log("successfully created a new user");

    res.redirect("welcome");
  });
});

app.get("/welcome", (req, res) => {
  // send the html view with our form to the client
  res.render("welcome", { user: req.Userprofile, layout: false });
});

//LOGIN-------------------------------------------------------->

app.post("/userLogin", (req, res) => {
  //res.send(req.body.username+" "+req.body.password);
  const username = req.body.username;
  const password = req.body.password;
  let actual_pass;

  if (username === "" || password === "") {
    // Render 'missing credentials'
    return res.render("login", {
      errorMsg: "Missing credentials.",
      layout: false,
    });
  }
  Userprofile.findAll({}).then(function (data) {
    for (var i = 0; i < data.length; i++) {
      if (
        data[i].username === username &&
        data[i].password === password &&
        data[i].usertype === "customer"
      ) {
        req.session.user = {
          name: data[i].name,
          username: data[i].username,
          email: data[i].email,
        };
        res.redirect("/userLogin");
      } else if (
        data[i].username === username &&
        data[i].password === password &&
        data[i].usertype === "clerk"
      ) {
        req.session.clerk = {
          name: data[i].name,
          username: data[i].username,
          email: data[i].email,
        };
        res.redirect("/clerkLogin");
      } else {
        // render 'invalid username or password'
        // render 'invalid username or password'
        res.render("login", {
          errorMsg: "invalid username or password!",
          layout: false,
        });
      }
    }
  });
});

// checking if  register is authenticated
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// checking if  register is authenticated
function ensureLogin_b(req, res, next) {
  if (!req.session.clerk) {
    res.redirect("/login");
  } else {
    next();
  }
}

//4 Add a middleware function that checks for authorization
app.get("/userLogin", ensureLogin, (req, res) => {
  res.render("userLogin", { user: req.session.user, layout: false });
});

//4 Add a middleware function that checks for authorization
app.get("/clerkLogin", ensureLogin_b, (req, res) => {
  res.render("clerkLogin", { user: req.session.clerk, layout: false });
});

// Log a user out by destroying their session
// and redirecting them to /login
app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/");
});

//---------------PACKAGE---------------------------------------->

app.get("/package", (req, res) => {
  // fetch all of the names and order them by id
  Package.findAll({
    order: ["id"],
  }).then((data) => {
    // render the "viewTable" view with the data
    res.render("package", {
      data: data,
      layout: false, // do not use the default Layout (main.hbs)
    });
  });
});

app.post("/registerPackage", (req, res) => {
  // name, username, email, password, photo

  Package.create({
    packagename: req.body.packagename,
    packageprice: req.body.packageprice,
    description: req.body.description,
    pfoodcategory: req.body.pfoodcategory,
    numberof: req.body.numberof,
  }).then(() => {
    console.log("successfully created a new package");
    res.redirect("package");
  });
});

app.post("/deletePackage", (req, res) => {
  // name, username, email, password, photo
  //console.log(req);
  Package.destroy({
    where: { id: req.body.id },
  }).then(() => {
    console.log("successsfully removed user: " + req.body.id);
    res.redirect("package"); // redirect back to the home page
  });
});

app.post("/updatePackage", (req, res) => {
  // name, username, email, password, photo
  //console.log(req);
  Package.update(
    {
      packagename: req.body.packagename,
      packageprice: req.body.packageprice,
      description: req.body.description,
      pfoodcategory: req.body.pfoodcategory,
      numberof: req.body.numberof,
    },
    {
      where: { id: req.body.id },
    }
  ).then(() => {
    console.log("successfully updated name: " + req.body.id);
    res.redirect("package"); // redirect back to the home page
  });
});

//---------------APP GET-----------------------------------------

app.get("/", (req, res) => {
  // send the html view with our form to the client
  res.sendFile(path.join(__dirname, "/home.html"));
});

app.get("/mealpackage", (req, res) => {
  // send the html view with our form to the client
  res.sendFile(path.join(__dirname, "/mealpackage.html"));
});

// setup a route on the 'root' of the url that has our form
// IE: http://localhost/
app.get("/login", (req, res) => {
  // send the html view with our form to the client
  res.render("login", { layout: false });
});

app.get("/register", (req, res) => {
  // send the html view with our form to the client
  res.render("register", { layout: false });
});

app.get("/package", (req, res) => {
  // send the html view with our form to the client
  res.render("package", { layout: false });
});

//---------------------------------------------------------------- FINISH

// listen on port 8080\. The default port for http is 80, https is 443\. We use 8080 here
// because sometimes port 80 is in use by other applications on the machine

sequelize.sync().then(() => {
  // start the server to listen on HTTP_PORT
  app.listen(HTTP_PORT, onHttpStart);
});

/*
Name: Luis Alberto Padilla Monroy 
StudentID: 118613207 
email: lapadilla-monroy@myseneca.ca 

Name of Work : lab6
Date : 12/12/2021 
*/
