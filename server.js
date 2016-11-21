//Local Testing server
express = require('express');

var server = express();
server.use(function (req, res, next) {
    console.log(req.url);
    next();
});
server.use(express.static(__dirname + '/dist/'));
server.use('/bower_components', express.static(__dirname + '/bower_components'));
server.listen(3000, 'localhost');
console.log(' *-Server started-* ');