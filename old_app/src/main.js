requirejs.config({
    paths: {
        jquery: 'bower_components/jquery/dist/jquery.min',
        underscore: 'bower_components/underscore/underscore-min',
        backbone: 'bower_components/backbone/backbone-min',
        'backbone-route-control': 'bower_components/backbone-route-control/backbone-route-control',
        bootstrap: 'bower_components/bootstrap/dist/js/bootstrap.min',
        bootstraptoggle: 'bower_components/bootstrap-toggle/js/bootstrap-toggle.min',
        text: 'bower_components/requirejs-text/text',
        templates: 'template',
        app: 'app'
    },
    deps: [
        'app', 'bootstrap', 'jquery', 'underscore'
    ],
    shim: {
        app: {
            deps: ['backbone', 'bootstrap', 'jquery', 'bootstraptoggle']
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['backbone', 'jquery']
        },
        bootstraptoggle: {
            deps: ['jquery', 'bootstrap']
        }
    }

});
