const http = require('http');
const fs = require('fs');
const url = require('url');
const readFile = require('./readFile');
const mysql = require('mysql');

// Create a MySQL connection
const connection = mysql.createConnection({
    host: '34.134.72.157',
    user: 'root',
    password: 'LateMateDB330',
    database: 'appointment'
  });
  
  // Connect to the database
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to database');
    
    // Drop the database if it exists
    connection.query('DROP DATABASE IF EXISTS clinic', (err) => {
      if (err) {
        console.error('Error dropping database:', err);
        return;
      }
      console.log('Dropped database');
  
      // Create the database
      connection.query('CREATE DATABASE clinic', (err) => {
        if (err) {
          console.error('Error creating database:', err);
          return;
        }
        console.log('Created database');
  
        // Use the database
        connection.query('USE clinic', (err) => {
          if (err) {
            console.error('Error using database:', err);
            return;
          }
          console.log('Using database');
        });
      });
    });
  });
  
//insert a user into the database
function insertUser(username, firstName, lastName, password) {
  return new Promise((resolve, reject) => {
    // Get a connection from the connection pool
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      }
      else {
        // Perform the SQL query to insert the user
        connection.query('INSERT INTO users (username, first_name, last_name, password) VALUES (?, ?, ?, ?)', [username, firstName, lastName, password], (err, results) => {
          // Release the connection back to the pool
          connection.release();
          if (err) {
            reject(err);
          }
          else {
            resolve(results);
          }
        });
      }
    });
  });
}


//check if a user exists in the database
function checkUser(username, password) {
    return new Promise((resolve, reject) => {
      // Get a connection from the connection pool
      pool.getConnection((err, connection) => {
        if (err) {
          reject(err);
        }
        else {
          // Perform the SQL query to check the user
          connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
            // Release the connection back to the pool
            connection.release();
            if (err) {
              reject(err);
            }
            else {
              resolve(results);
            }
          });
        }
      });
    });
  }
  
// search for doctors in the database
function searchDoctor(firstName, lastName) {
    return new Promise((resolve, reject) => {
      // Perform the SQL query to search for the doctor
      connection.query('SELECT * FROM doctors WHERE first_name = ? AND last_name = ?', [firstName, lastName], (err, results) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(results);
        }
      });
    });
  }

//call back function
serveStatic = function (req, res) {
    const path = url.parse(req.url).pathname;
  
    if (req.method === 'GET') {
      if (path == '/') {
        readFile.readFile('./public-html/homepage.html', res);
      }
      else if (path == "/login") {
        readFile.readFile('./public-html/login.html', res);
      }
      else if (path == "/signup") {
        readFile.readFile('./public-html/signup.html', res);
      }
      else if (path == "/doctors") {
        readFile.readFile('./public-html/doctor_search.html', res);
      }
      else if (path == "/doctor_results") {
        readFile.readFile('./public-html/doctor_results.html', res);
      }
      else {
        readFile.readFile('./public-html' + path, res);
      }
    }
    else if (req.method === 'POST' && path === '/signup') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          const formData = querystring.parse(body);
          const username = formData.username;
          const firstName = formData.fname;
          const lastName = formData.lname;
          const password = formData.pward;
    
          // insert the user into the database
          insertUser(username, firstName, lastName, password)
            .then(results => {
              res.writeHead(302, {
                'Location': '/signup_success.html'
              });
              res.end();
            })
            .catch(err => {
              console.error('Error inserting user:', err);
              res.writeHead(500);
              res.end();
            });
        });
      }
    else if (req.method === 'POST' && path === '/login') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          const formData = querystring.parse(body);
          const username = formData.username;
          const password = formData.pward;
    
          // check if the user exists in the database
          checkUser(username, password)
            .then(authenticated => {
              if (authenticated) {
                res.writeHead(302, {
                  'Location': '/homepage.html'
                });
                res.end();
              }
              else {
                res.writeHead(302, {
                  'Location': '/login.html?error=1'
                });
                res.end();
              }
            })
            .catch(err => {
              console.error('Error checking user:', err);
              res.writeHead(500);
              res.end();
            });
        });
      }
    } 

    else if (req.method === 'POST' && path === '/searchDoctor') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          const formData = querystring.parse(body);
          const firstName = formData.fname;
          const lastName = formData.lname;
      
          // search for doctors in the database
          connection.query('SELECT * FROM doctors WHERE first_name LIKE ? AND last_name LIKE ?', [`%${firstName}%`, `%${lastName}%`], (err, results) => {
            if (err) {
              console.error('Error searching for doctors:', err);
              res.writeHead(500);
              res.end();
            }
            else {
              const data = {
                doctors: results
              };
              const html = ejs.render(fs.readFileSync('./public-html/doctor_results.html', 'utf8'), data);
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.write(html);
              res.end();
            }
          });
        });
      }
    
const myserver = http.createServer(serveStatic); //create a server object
myserver.listen(80, function() {console.log("Listening on port 80" )}); 
