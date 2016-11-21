define( function (require){
    var gameView = require('view/gameboard');

    return Controller = function(options) {
        var app = options.app;

        return {
            //View functions
            // New Game view
            newGame: function() {
                var view = new gameView({controller: this});
                view.renderCreate();
            },

            //Join Game view
            joinGame: function(id) {
                var view = new gameView({controller: this});
                view.renderGame(id);
            }

        };
    };

});