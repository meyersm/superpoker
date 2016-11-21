define( function(require) {
    var BackboneRouteControl = require('backbone-route-control');

    return BackboneRouteControl.extend({
        routes: {
            '':                 'game#newGame',
            'home':             'home#index',
            'create':           'game#newGame',
            'game/:id':         'game#joinGame'
        }
    });
});
