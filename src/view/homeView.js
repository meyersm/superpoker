define( function (require) {
    var Backbone = require('backbone');
    var _ = require('underscore');
    var tmpl = require('text!template/home.html');

    return Backbone.View.extend({
        initialize: function (options) {
            this.options = options || {};
            this.app = window.app;
        },

        render: function () {
            this.app.mainView.html(_.template(tmpl));
        }


    });
});