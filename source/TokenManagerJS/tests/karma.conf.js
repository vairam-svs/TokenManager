module.exports = function (config) {
    config.set({
        basePath: '../',
        frameworks: ['jasmine'],
        plugins:[
            'karma-jasmine',
            'karma-chrome-launcher'
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
        singleRun: false
    });
};
