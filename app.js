const http = require('http');
const fs = require('fs');
const url = require('url');
const readFile = require('./readFile');


//call back function
serveStatic = function (req, res) {
    const path = url.parse(req.url).pathname;
    const queryObj = url.parse(req.url,"true").query;
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
        readFile.readFile('./public-html'+path, res);
    }
}
 
const myserver = http.createServer(serveStatic); //create a server object
myserver.listen(80, function() {console.log("Listening on port 80" )}); 