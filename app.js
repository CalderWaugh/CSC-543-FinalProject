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

async function queryExec(query) { return await promiseQuery(query) };

function promiseQuery(query) {
    return new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        })
    })
}

async function hashPassword(password) { return await passwordHasher(password) };

function passwordHasher(password) {
  return new Promise((resolve, reject) => {
    bcrypt
    .hash(password, 8)
    .then(hash => { return resolve(hash) })
    .catch(err => reject(err.message))
  })

}

app.use(express.urlencoded({
  extended: true
}))

app.get("/", (req, res) => {
  console.log(current_user);
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login", { message: '' });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let user = '';
  let users = '';
  let passwordMatch = false;
  let query = `SELECT username, first_name, last_name, password FROM patient WHERE username = '${username}'`;
  
  users = await queryExec(query);

  if (users.length > 0) {
    user = users[0];
    await bcrypt
      .compare(password,user.password)
      .then(res => { passwordMatch = res })
      .catch(err => console.error(err.message))  
    if (passwordMatch) {
      current_user.logged_in = true;
      current_user.username = user.username;
      current_user.first_name = user.first_name;
      current_user.last_name = user.last_name;
      return res.redirect('/');
    } else {
      return res.render('login', { message: 'Password doesn\'t match' })
    }
  }
  return res.render('login', { message: 'Unknown user' })
});


app.get("/signup", (req, res) => {
  res.render("signup", { message: '' });
});

app.post("/signup", async (req, res) => {
  const { username, first_name, last_name, password } = req.body;
  let users = '';
  let query = `SELECT username FROM patient WHERE username = '${username}'`;
  
  users = await queryExec(query);

  if( users.length > 0 ) return res.render('signup', {message: "That username already exists"});

  const hashedPassword = await hashPassword(password);

  query = `INSERT INTO patient SET username='${username}', first_name='${first_name}', last_name='${last_name}', password='${hashedPassword}'`;
  const result = await queryExec(query);
  return res.redirect('../login');
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
