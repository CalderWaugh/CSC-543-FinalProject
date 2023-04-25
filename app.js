const http = require('http');
const fs = require('fs');
const url = require('url');
const readFile = require('./readFile');

let doc_array = new Array();
doc_array[0] = {name: "Alia", phone: "860-345-7878"};
doc_array[1] = {name: "Allie", phone: "203-908-3409"};
doc_array[2] = {name: "Aly", phone: "413-486-5667"};

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
    // else if (path.indexOf("/doctors") == 0) {
    //     if (path == "/doctors") readFile.readFile('./public-html/doctor_search.html', res);
    //     else {
    //         let pathArr = path.split('/');
    //         readFile.readFile('./public-html/doctor_results.html', res);
    //     }
    // }
    else if (path == "/doctor_results") {
        readFile.readFile('./public-html/doctor_results.html', res);
    }
    else {
        readFile.readFile('./public-html'+path, res);
    }
}
 
const myserver = http.createServer(serveStatic); //create a server object
myserver.listen(80, function() {console.log("Listening on port 80" )}); 