const fs = require('fs');
const path = require('path');

function readFile (fileName, res) {
	fs.readFile(fileName, function(err,data) {
		if (err) handleError(res);
		else {
			var ext = path.extname(fileName);
			contentType = getContentType(ext);
			res.writeHead(200, {'Content-Type': contentType})
			res.write(data);
			res.end();
		}
	})
}

function getContentType(ext) {
	switch(ext) {
		case '.jpg': return 'image/jpeg';
		case '.png': return 'image/png';
		case '.gif': return 'image/gif';
		case '.html': return 'text/html';
		case '.css': return 'text/css';
		case '.js': return 'text/javascript';
		case '.txt': return 'text/plain';
		case '.html': return 'text/html';
	}
}

function handleError(res) {
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.write('404 error');
	res.end();
}

module.exports.readFile = readFile;