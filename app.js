// Import Modules
const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const dotenv = require('dotenv');
const app = express();

let current_user = {
  logged_in: false,
  user_type: '',
  id: -1,
  username: '',
  first_name: '',
  last_name: ''
}

let new_appointment = {
  admission_date: '',
  doc_username: '',
  doc_first_name: '',
  doc_last_name: '',
  date: '',
}

let times = [
  '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
]

let templateObj = {
  current_user: current_user
}

// -------------------------
// ------ APP SETUP --------
// -------------------------

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
dotenv.config({ path: './.env'});


// -------------------------
// ------- DATABASE --------
// -------------------------

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

// -------------------------
// --- PASSWORD HASHING ----
// -------------------------

async function hashPassword(password) { return await passwordHasher(password) };
function passwordHasher(password) {
  return new Promise((resolve, reject) => {
    bcrypt
    .hash(password, 8)
    .then(hash => { return resolve(hash) })
    .catch(err => reject(err.message))
  })

}

// Homepage
app.get("/", (req, res) => {
  res.render("home", templateObj);
});


// -------------------------
// -------- LOG IN ---------
// -------------------------

app.get("/login", (req, res) => {
  templateObj.message = ''
  res.render("login_pick_usertype", templateObj);
});

app.get("/login/:user_type", (req, res) => {
  templateObj.message = '';
  if (['doctor', 'patient'].includes(req.params.user_type)) {
    templateObj.user_type = req.params.user_type;
    res.render("login", templateObj);
  } else return
});

app.post("/login/:user_type", async (req, res) => {
  const { username, password } = req.body;
  const user_type = req.params.user_type;
  let user = '';
  let users = '';
  let query = ''
  let passwordMatch = false;
  if (user_type == 'patient') query = `SELECT patient_id, username, first_name, last_name, password FROM patient WHERE username = '${username}'`;
  else query = `SELECT doctor_employee_id, username, first_name, last_name, password FROM doctor WHERE username = '${username}'`;
  
  users = await queryExec(query);

  if (users.length > 0) {
    user = users[0];
    await bcrypt
      .compare(password,user.password)
      .then(res => { passwordMatch = res })
      .catch(err => console.error(err.message))  
    if (passwordMatch) {
      current_user.logged_in = true;
      current_user.user_type = user_type;
      if (user_type == 'patient') current_user.id = user.patient_id;
      else current_user.id = user.doctor_employee_id;
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

// -------------------------
// -------- SIGN UP --------
// -------------------------

app.get("/signup", (req, res) => {
  templateObj.message = '';
  res.render("signup_pick_usertype", templateObj);
});

app.get("/signup/:user_type", (req, res) => {
  templateObj.message = '';
  if (['doctor', 'patient'].includes(req.params.user_type)) {
    templateObj.user_type = req.params.user_type;
    res.render("signup", templateObj);
  } else return
});

app.post("/signup/:user_type", async (req, res) => {
  const { username, first_name, last_name, password } = req.body;
  const user_type = req.params.user_type;
  let users = '';
  let query = `SELECT username FROM ${user_type} WHERE username = '${username}'`;
  
  users = await queryExec(query);

  if( users.length > 0 ) {
    templateObj.user_type = user_type;
    templateObj.message = "That username already exists";
    return res.render('signup', templateObj);
  }

  const hashedPassword = await hashPassword(password);

  query = `INSERT INTO ${user_type} SET username='${username}', first_name='${first_name}', last_name='${last_name}', password='${hashedPassword}'`;
  const result = await queryExec(query);
  return res.redirect('../login');
});

app.post('/logout', (req,res) => {
  if (!current_user.logged_in) return res.redirect('/');
  current_user = {
    logged_in: false,
    user_type: '',
    id: -1,
    username: '',
    first_name: '',
    last_name: ''
  }
  templateObj.current_user = current_user;
  return res.redirect('/')
});

// -------------------------
// ----- APPOINTMENTS ------
// -------------------------

// my appointments 

//my appointments 
app.get("/myappointments", async (req, res) => {
  console.log("started my appointments query")
  
  if (!current_user.logged_in) return res.redirect('/');

  const myAptQuery = `SELECT d.first_name, d.last_name, a.date, a.status FROM appointment AS a JOIN doctor AS d WHERE a.patient_id = ${current_user.id}`;

  try {
    const results = await queryExec(myAptQuery);

    const myApt = results.map(row => ({
      first_name: row.first_name,
      last_name: row.last_name,
      date: row.date,
      status: row.status
    }));

    console.log("appointment data received: ")

    const templateObj = { myApt, current_user };

    res.render("myappointments", templateObj);
  } catch (error) {
    console.log("error receiving appointment data: ", error);
    res.sendStatus(500);
  }
});

app.get("/appointment/new/:doc_id/:date/:time", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  res.render("create_appointment", templateObj);
});

app.post("/find_available_times", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  const { doc_id, date } = req.body;
  res.redirect(`/doctors/${doc_id}/${date}/pick_time`);
});

app.get("/doctors/:doc_id/pick_date", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  templateObj.doc_id = req.params.doc_id
  res.render("appointment_pick_date", templateObj);
});

app.get("/doctors/:doc_id/:date/pick_time", async (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  const docId = req.params.doc_id;
  const appointmentDate = req.params.date;
  const taken_times = await queryExec(`SELECT DATE_FORMAT(date,'%H:%i') FROM appointment WHERE doctor_employee_id = ${docId} AND date = ${appointmentDate}`);
  const availableTimes = times.filter(time => !(taken_times.includes(time)));
 
  templateObj.doc_id = docId;
  templateObj.appointmentDate = appointmentDate;
  templateObj.availableTimes = availableTimes;


  res.render("available_times", templateObj);
});


// -------------------------
// -------- PROFILE --------
// -------------------------

app.get('/myprofile', (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  res.redirect(`/profile/${current_user.user_type}/${current_user.id}`);
})

app.get('/profile/:user_type/:id', async (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  const {id,user_type} = req.params;
  let user = '';
  if (user_type == 'patient') query = `SELECT patient_id, username, first_name, last_name FROM patient WHERE patient_id = ${id}`;
  else query = `SELECT doctor_employee_id, username, first_name, last_name FROM doctor WHERE doctor_employee_id = ${id}`;
  try { user = await queryExec(query) } catch { return }
  user = user[0];
  user.user_type = user_type;
  templateObj.user = user;
  res.render("profile", templateObj);
})

// -------------------------
// -------- DOCTOR ---------
// -------------------------

app.get("/doctors", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  templateObj.doctors = [];
  templateObj.error = '';
  res.render("doctor_search", templateObj);
});

app.post("/doctors", async (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  const { fname, lname } = req.body;
  let docs = '';
  let query = `SELECT doctor_employee_id, first_name, last_name FROM doctor WHERE first_name LIKE '%${fname}%' AND last_name LIKE '%${lname}%'`;
  
  docs = await queryExec(query);

  templateObj.doctors = docs;
  if (docs.length == 0) templateObj.error = 'No matching doctors';
  res.render('doctor_search', templateObj);
});

// -------------------------
// ------- PATIENT ---------
// -------------------------

app.get("/patients", (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  templateObj.patients = [];
  templateObj.error = '';
  res.render("patient_search", templateObj);
});

app.post("/patients", async (req, res) => {
  if (!current_user.logged_in) return res.redirect('/');
  const { fname, lname } = req.body;
  let patients = '';
  let query = `SELECT patient_id, first_name, last_name FROM patient WHERE first_name LIKE '%${fname}%' AND last_name LIKE '%${lname}%'`;
  
  patients = await queryExec(query);

  if (patients.length == 0) templateObj.error = "No matching patients";
  else templateObj.error = "";

  templateObj.patients = patients;
  res.render('patient_search', templateObj);
});

app.listen(80, () => {
  console.log(`Listening on port 80`);
});
