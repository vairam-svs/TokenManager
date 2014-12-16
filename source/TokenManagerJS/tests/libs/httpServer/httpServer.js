var express = require('express');

var createHttpServer = function (logger, karmaHttpServer) {
    var log = logger.create('httpServer');
    log.info('Starting http server');

    var app = express();

    karmaHttpServer.configure(app, log);

    app.listen(karmaHttpServer.port, function () {
        log.info('Http server started');
    });
};

createHttpServer.$inject = ['logger', 'config.karmaHttpServer'];

module.exports = createHttpServer;