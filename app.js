const express = require("express");
const path = require("path");
const app = express();
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const dotenv = require('dotenv');

const current_user = {
  logged_in: false,
  username: '',
  first_name: '',
  last_name: ''
}

app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
dotenv.config({ path: './.env'});

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
})

db.connect((error) => {
  if(error) {
      console.log(error)
  } else {
      console.log("MySQL connected!")
  }
})

app.use(express.urlencoded({
  extended: true
}))

app.get("/", (req, res) => {
  console.log(current_user);
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});


app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  const results = db.query('SELECT username, first_name, last_name FROM patient WHERE username = ?', [username], async (error, result) => {
    if(error) console.log(error);
  })

  if( results.values.length > 0 ) {
    const user = results.values[0];
    current_user.logged_in = true;
    current_user.username = user.username;
    current_user.first_name = user.first_name;
    current_user.last_name = user.last_name;
    return res.redirect('/');
  }
});


app.get("/signup", (req, res) => {
  res.render("signup", { message: '' });
});

app.post("/register", async (req, res) => {
  const { username, first_name, last_name, password } = req.body;

  const results = db.query('SELECT username FROM patient WHERE username = ?', [username], async (error, result) => {
    if(error) console.log(error);
  })

  if( results.values.length > 0 ) {
    return res.render('signup', {message: "That username already exists"});
  }

  
  let hashedPassword = bcrypt.hash(password, 8);

  db.query('INSERT INTO patient SET?', {username: username, first_name: first_name, last_name: last_name, password: password}, (error, result) => {
    if(error) console.log(error)
    else {
      return res.redirect('../login');
    }
})
});

app.get("/myappointments", (req, res) => {
  res.render("myappointments");
});

app.get("/create_appointment", (req, res) => {
  res.render("create_appointment");
});

app.get("/available_times", (req, res) => {
  res.render("available_times");
});

app.get("/appointment_pick_date", (req, res) => {
  res.render("appointment_pick_date");
});

app.get("/doctor_search", (req, res) => {
  res.render("doctor_search");
});

app.get("/doctor_results", (req, res) => {
  res.render("doctor_results");
});

app.listen(80, () => {
  console.log(`Listening on port 80`);
});