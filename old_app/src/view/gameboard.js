define( function (require) {
    var Backbone = require('backbone');
    var _ = require('underscore');
    var tmpl = require('text!template/game.html');
    var tmplCreate = require('text!template/newgame.html');
    var cardTmpl = require('text!template/myCard.html');
    var playerTmpl = require('text!template/otherCard.html');
    var observerTmpl = require('text!template/observerCard.html');
    var eventDispTmpl = require('text!template/eventDisplay.html');

    var standardCardDeck = [1,2,3,5,8,13,20,40,'?'];

    return Backbone.View.extend({
        initialize: function (options) {
            this.options = options || {};
            this.controller = options.controller;
            this.app = window.app;
        },

        renderCreate: function () {
            this.app.mainView.html(_.template(tmplCreate));
            $('#newgame-create').on('click', $.proxy(this.createNewGame, this));
        },

        renderGame: function (id) {
            var data = {};
            this.app.current_game_id = id;
            data.game_id = id;
            this.app.mainView.html(_.template(tmpl)(data));
            this.preGame();
        },

        // ------- NewGame func

        createNewGame: function () {
            var newGameGuid = this.app.generateGuid();
			this.app.firebase.ref('games/' + newGameGuid + '/gamedata').set({
				title: $('#newgame-title').val(),
				desc: $('#newgame-desc').val(),
				round: 1,
                startTime: Date.now(),
                leader: this.app.userGuid

			});
			this.app.router.navigate('game/'+newGameGuid, {trigger: true});

        },


        // ------- Game func

        preGame: function() {
            var self = this;
            this.$joinGame = $('#sp-modal-joingame');
            $('#observer-checkbox').bootstrapToggle();
            this.$joinGameName = $('#sp-modal-joingame-name');
            this.$cards = $('.sp-game-cards');
            this.$tabletop = $('.sp-game-tabletop');
            this.$sidepanel = $('.sp-game-sidepanel');
            this.$sidepanelChatInput = $('#sidecontrol-chatinput');
            this.$sidepanelEvents = $('.sp-game-sidepanel-events');
			this.$endRoundHead = $('#endround-head');
			this.$endRoundDetail = $('#endround-detail');

            this.$joinGameName.val(this.app.user);
            $('#sp-modal-joingame-btn').on('click', function () {
                self.isObserver = false;
                self.app.user = $('#sp-modal-joingame-name').val();
                if ($('#observer-checkbox').is(":checked"))
                    self.isObserver = true;
                self.setupGame.apply(self);
                self.$joinGame.modal('hide');
            });
            this.$joinGame.modal();
            $('#sp-app-info').on('click', function () {
                $('#sp-modal-appinfo').modal('show');
            })

        },

        setupGame: function () {
            var self = this;
            self.resetEverything();
            self.addPlayerToGame();

            //Game info
            var gameDataRef = self.app.firebase.ref('games/' + self.app.current_game_id + '/gamedata');
            gameDataRef.on('value', function(snapshot) {
                var data = snapshot.val();
                $('.sp-game-toppanel-title').text(data.title);
                $('.sp-game-toppanel-desc').text(data.desc);
            });
            //Setup Cards
            self.cards = standardCardDeck;
            if (!self.isObserver) {
                _.each(self.cards, function(c) {
                    self.$cards.append(_.template(cardTmpl)({card: c}));
                });
                $('.sp-game-cards-c').on('click', $.proxy(self.cardSelected, self));
            }
            //Setup Tabletop
			this.playerCache = {};
            var players = self.app.firebase.ref('games/' + self.app.current_game_id + '/users');
            players.on('value', function(snapshot) {
                self.setupTabletop(snapshot.val());
            });
            var otherPlayerCards = self.app.firebase.ref('games/' + self.app.current_game_id + '/cards');
            otherPlayerCards.on('value', function(snapshot) {
                self.updateTabletop(snapshot.val());
            });
            //Setup gamestate events
            var eventStartupThrottle = true;
            var gameEvents = self.app.firebase.ref('games/' + self.app.current_game_id + '/events').limitToLast(5);
            gameEvents.on('child_added', function(data) {
                if (!eventStartupThrottle)
                    self.handleGameEvent(data.key, data.val().action, data.val().user);
            });
            setTimeout(function (){
                eventStartupThrottle = false;
            }, 1500);
            $('.sp-game-sidepanel-top > button').on('click', function (e) {
                var action = $(this).data('action');
                self.sendGameEvent(action);
            });

            //Setup chat?
            var chatMsgs = self.app.firebase.ref('games/' + self.app.current_game_id + '/chat');
            chatMsgs.on('child_added', function(data) {
                self.handleChatMessage(data.key, data.val().text, data.val().user);
            });
            $('#sidecontrol-chatinput').keyup(function(event){
                if(event.keyCode == 13){
                    $('#sidecontrol-chatbtn').click();
                }
            });
            $('#sidecontrol-chatbtn').on('click', function () {
                var text = self.$sidepanelChatInput.val();
                self.$sidepanelChatInput.val('');
                self.sendChatMessage(text);
            });


        },

        addPlayerToGame: function() {
            var self = this;
            self.app.firebase.ref('games/' + this.app.current_game_id + '/users/' + self.app.userGuid).set({
                name: self.app.user,
                currentCard: null,
                observer: self.isObserver
            });
            var player = {};
            player[self.app.userGuid] = self.app.user;
            self.app.firebase.ref('games/' + this.app.current_game_id + '/players/').update(player);
            self.app.saveLocalStorage.apply(self.app);
        },

        cardSelected: function (e) {
            var $card = $(e.target);
            if ($card.hasClass('selected')) {
                $card.removeClass('selected');
                this.sendCard(null);
            } else {
                this.$cards.find('.selected').removeClass('selected');
                $card.addClass('selected');
                this.sendCard($card.data('value'));
            }
        },

        sendCard: function (num) {
            var self = this;
            if (!_.contains(self.cards, num)) {
                console.log('Invalid card value - ' + num + ' This will be interpreted as a ? - Reload the app to correct this issue');
            }
            self.app.firebase.ref('games/' + this.app.current_game_id + '/cards/' + self.app.userGuid).update({
                value: num
            });
        },

        setupTabletop: function (players) {
            var self = this;

            _.each(players, function(p,k) {
                var data = {guid: k, name: p.name, observer: p.observer, leader: p.leader};
                var playerCacheHash = self.generatePlayerCacheHash(p);
                if (self.playerCache[k] !== playerCacheHash) {
                    if (self.playerCache[k]) {
                        self.$tabletop.find('[data-guid='+ k + ']').remove();
                    }
                    if (p.observer === true)
                        self.$tabletop.prepend(_.template(observerTmpl)(data));
                    else
                        self.$tabletop.append(_.template(playerTmpl)(data));
                    self.playerCache[k] = playerCacheHash;
                }
            });
        },

        generatePlayerCacheHash: function (player) {
            var pch = player.name + '::';
            if (player.observer)
                pch = pch + '1';
            else
                pch = pch + '0';
            return pch;
        },

        updateTabletop: function (cards) {
            var self = this;

            self.$tabletop.find('.chosen').removeClass('chosen');
            _.each(cards, function(c,p) {
                self.$tabletop.find('[data-guid='+ p + '] > .sp-game-tabletop-player-card').addClass('chosen');
                if ((c.value !== undefined) && (!_.contains(self.cards, c.value))) {
                    c.value = '?';
                }
                self.hiddenDeck[p] = c;
            });


        },

        sendGameEvent: function (action) {
            var self = this;
            self.app.firebase.ref('games/' + self.app.current_game_id + '/events').push({
                user: self.app.user,
                action: action
            });

			if (action === 'next') {
				self.app.firebase.ref('games/' + self.app.current_game_id + '/cards').remove();
			}
        },

        handleGameEvent: function (key, action, user) {
            var displayText = action;
            if (action === 'reveal'){
                this.revealCards();
                displayText = 'Revealed the cards!';
            } else if (action === 'reset') {
                this.resetCards();
                displayText = 'Reset the cards!';
            } else if (action === 'next') {
                this.nextRound();
                displayText = 'Started the next round';
            }


            this.displayEvent(user, displayText, 'evt-game');
        },

        sendChatMessage: function (text) {
            var self = this;
            self.app.firebase.ref('games/' + self.app.current_game_id + '/chat').push({
                user: self.app.user,
                text: text
            });
        },

        handleChatMessage: function (key, text, user) {
            this.displayEvent(user + ':', text, 'evt-chat');
        },

        displayEvent: function (header, text, css) {
            var self = this;
            css = css || '';
            var data = {header: header, text: text, css: css};

            self.$sidepanelEvents.append(_.template(eventDispTmpl)(data));
            self.$sidepanelEvents[0].scrollTop = self.$sidepanelEvents[0].scrollHeight;
        },

        revealCards: function () {
            var self = this;
            var i = 0;
            _.each(self.hiddenDeck, function (c, p) {
                var $card = self.$tabletop.find('[data-guid='+ p + '] > .sp-game-tabletop-player-card');
                var $cardBack = self.$tabletop.find('[data-guid='+ p + '] > .sp-game-tabletop-player-cardback');
                $card.addClass('reveal-flip');
                $cardBack.addClass('reveal-flop');
                $cardBack.text(c.value);
            });
            self.calculateStoryPoints();
        },

        resetCards: function () {
            this.$tabletop.find('.sp-game-tabletop-player > .player-card').removeClass('reveal-flip').removeClass('reveal-flop').text('');
            $('.sp-game-sidepanel-endround > span').text('');
        },

        nextRound: function () {
            this.resetCards();
            this.resetEverything();
        },

        calculateStoryPoints: function () {
            var self = this;
            var total = 0;
            var distribution = {};
            var i = 0;
            var pass = 0;
            for (var k in self.hiddenDeck) {
                var c = self.hiddenDeck[k];
                if (c.value !== '?')
                    total = total + c.value;
                else {
                    pass++;
                }
                distribution[c.value] = ((distribution[c.value] === undefined) ? 1 : (distribution[c.value] + 1));
                i++;
            }
            var currHigh = {sp:0,val:0,per:0};
            var majorityReached = false;
            var j = 0;
            for (var key in distribution) {
                var value = distribution[key];
                if (value > currHigh.val) {
                    currHigh.sp = key;
                    currHigh.val = value;
                    if (value > (i / 2)) {
                        majorityReached = true;
                    }
                    currHigh.per = Math.round((value / i) * 100);
                }
                j++;
            }
            var spAvg = 0;
            if ((i - pass) > 0)
                spAvg = Math.round(total / (i - pass));

            this.$endRoundHead.removeClass();//Remove all classes
            if (j === 1) {
                this.$endRoundHead.text('Consensus');
                this.$endRoundHead.addClass('endround-consensus');
                this.$endRoundDetail.text('Unanimous votes');
            } else if (majorityReached) {
                this.$endRoundHead.text('Majority');
                this.$endRoundHead.addClass('endround-majority');
				this.$endRoundDetail.text('With ' + currHigh.per + '% of vote (' + currHigh.val + ' of ' + i + ')');
            } else {
                this.$endRoundHead.text('Divided vote');
                this.$endRoundHead.addClass('endround-divided');
				this.$endRoundDetail.text('With ' + currHigh.per + '% of vote (' + currHigh.val + ' of ' + i + ')');
            }

            $('#endround-cardval').text(currHigh.sp);

            $('#endround-avg').text('Average of ' + spAvg);
        },

        resetEverything: function () {
            var self = this;
            self.hiddenDeck = {};
            self.$tabletop.find('.chosen').removeClass('chosen');
            self.$cards.find('.selected').removeClass('selected');
            $('#endround-head').removeClass();//Remove all classes
            $('.sp-game-sidepanel-endround > span').text('');
        }



    });
});