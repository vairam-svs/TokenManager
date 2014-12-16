module.exports = function (config) {
    config.set({
        basePath: '../',
        frameworks: ['jasmine', 'karma-http-server'],
        plugins:[
            'karma-jasmine',
            'karma-chrome-launcher',
            require('./libs/httpServer/index.js')
        ],
        files: [
            'oidc/defaultHttpRequest.js',
            'oidc/defaultPromiseFactory.js',
            'oidc/token-manager.js',
            'oidc/oidcclient.js',
            'oidc/defaultHttpRequest.js',
            'tests/**/*.spec.js'
        ],
        exclude: [],
        preprocessors: {},
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: false,

        karmaHttpServer: {
            port: 7513,
            configure: function (app, log) {
                console.log('fooo');
                log.info('Visiting');

                app.get('/invalid-json', function (req, res) {
                    res.send('');
                });

                app.get('/valid-json', function (req, res) {
                    res.send(JSON.stringify({foo: 'bar'}));
                });
            }
        }
    });
};
