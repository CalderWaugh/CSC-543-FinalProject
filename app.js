const express = require("express");
const path = require("path");
const app = express();
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const dotenv = require('dotenv');

let current_user = {
  logged_in: false,
  username: '',
  first_name: '',
  last_name: ''
}

let templateObj = {
  current_user: current_user
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

db.connect((error) =>  error ? console.log(error) : console.log("Connected to database!"));

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
  res.render("home", templateObj);
});

app.get("/login", (req, res) => {
  templateObj.message = ''
  res.render("login", templateObj);
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
      templateObj.current_user = current_user;
      return res.redirect('/');
    } else {
      templateObj.message = 'Incorrect Password';
      return res.render('login', templateObj);
    }
  }
  templateObj.message = 'Unknown user';
  return res.render('login', templateObj)
});


app.get("/signup", (req, res) => {
  templateObj.message = '';
  res.render("signup", templateObj);
});

app.post("/signup", async (req, res) => {
  const { username, first_name, last_name, password } = req.body;
  let users = '';
  let query = `SELECT username FROM patient WHERE username = '${username}'`;
  
  users = await queryExec(query);

  if( users.length > 0 ) {
    templateObj.message = "That username already exists";
    return res.render('signup', templateObj);
  }

  const hashedPassword = await hashPassword(password);

  query = `INSERT INTO patient SET username='${username}', first_name='${first_name}', last_name='${last_name}', password='${hashedPassword}'`;
  const result = await queryExec(query);
  return res.redirect('../login');
});

app.post('/logout', (req,res) => {
  if (!current_user.logged_in) return res.redirect('/');
  current_user = {
    logged_in: false,
    username: '',
    first_name: '',
    last_name: ''
  }
  templateObj.current_user = current_user;
  return res.redirect('/')
});

app.get("/myappointments", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  res.render("myappointments", templateObj);
});

app.get("/create_appointment", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  res.render("create_appointment", templateObj);
});

app.get("/available_times", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  res.render("available_times", templateObj);
});

app.get("/appointment_pick_date", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  res.render("appointment_pick_date", templateObj);
});

app.get("/doctor_search", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  templateObj.doctors = [];
  res.render("doctor_search", templateObj);
});

app.post("/doctor_search", async (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  const { fname, lname } = req.body;
  let docs = '';
  let query = `SELECT doctor_employee_id, first_name, last_name FROM doctor WHERE first_name LIKE '%${fname}%' AND last_name LIKE '%${lname}%'`;
  
  docs = await queryExec(query);

  templateObj.doctors = docs;
  res.render('doctor_search', templateObj);
});

app.get("/doctor_results", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  res.render("doctor_results", templateObj);
});

app.listen(80, () => {
  console.log(`Listening on port 80`);
});