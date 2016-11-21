define( function (require){
    var myView = require('view/homeView');

    return Controller = function(options) {
        var app = options.app;

        return {
            // Home
            index: function() {
                var view = new myView();
                view.render();
            }


        };
    };

});