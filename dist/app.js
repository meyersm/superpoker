(function () {

    define(function (require) {
        require('jquery');
        var Backbone = require('backbone');
        var _ = require('underscore');
        Backbone.$ = $;

        var Router = require('routing/router');
        var GameController = require('controller/game');
        var HomeController = require('controller/home');

        var Application = function () {
            this.initialize();
        };

        Application.prototype.initialize = function () {

            this.initVars();
            this.initRouting();
            Backbone.history.start();

        };

        Application.prototype.initVars = function () {
            window.app = this;
            this.eventHash = {};
            this.user = {};

            this.mainView = $('#sp-main');
            this.contentView = null;
            this.initFirebase();
            this.initLocalStorage();
        };

        Application.prototype.initFirebase = function () {
            // Initialize Firebase
            var config = {
                apiKey: "AIzaSyDbr1TppHWm2RTFx28gKwFvQjsvDNAhU4A",
                authDomain: "planningpoker-f60a7.firebaseapp.com",
                databaseURL: "https://planningpoker-f60a7.firebaseio.com",
                storageBucket: "planningpoker-f60a7.appspot.com",
                messagingSenderId: "595581804191"
            };
            firebase.initializeApp(config);
            this.firebase = firebase.database();
        };

        Application.prototype.initLocalStorage = function () {
            var spData = localStorage.getItem('super-poker-userGuid');
            if (spData === null) {
                this.user = 'New Player';
                this.userGuid = this.generateGuid();
            } else {
                this.user = localStorage.getItem('super-poker-user') || 'New Player';
                this.userGuid = spData
            }
        };

        Application.prototype.initRouting = function () {
            this.gameController = new GameController({app: this});
            this.homeController = new HomeController({app: this});

            this.router = new Router({
                app: this,
                controllers: {game: this.gameController, home: this.homeController}
            });
        };

        Application.prototype.saveLocalStorage = function () {
            localStorage.setItem('super-poker-user', this.user);
            localStorage.setItem('super-poker-userGuid', this.userGuid);
        };

        Application.prototype.generateGuid = function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };

        Application.prototype.on = function (event, callback) {
            if ((!event) || (!callback))
                return;
            (this.eventHash[event] = this.eventHash[event] ? this.eventHash[event] : []).push(callback);
        };

        Application.prototype.trigger = function (event, data) {
            _.each(this.eventHash[event], function (callback){
                callback(data);
            })
        };

        var app = new Application();
    });
})(this);
