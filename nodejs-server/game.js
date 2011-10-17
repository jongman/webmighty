(function() {
  var CARD_HEIGHT, CARD_OVERLAP, CARD_WIDTH, COLLECTED_CARD_GAP, Card, ChangePromiseHelper, DEFAULT_SPEED_BASE, DISAPPEAR_DIRECTION, PI, PLAYED_CARD_RADIUS, PLAYER_LOCATION, PROFILE_CARD_GAP, PROFILE_WIDTH, PlayingField, SCORE_CARD_VALUES, SPEED_BASE, SUIT_NAMES, TEST_CARDS, TEST_CARDS6, VALUE_NAMES, VALUE_ORDER, assert, field, floor, isScoreCard, lexicographic_compare, renderFaceName, runInterval;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  PROFILE_WIDTH = 250;
  PROFILE_CARD_GAP = 15;
  CARD_WIDTH = 71;
  CARD_HEIGHT = 96;
  CARD_OVERLAP = 20;
  DEFAULT_SPEED_BASE = 50;
  SPEED_BASE = 50;
  PI = Math.PI;
  PLAYED_CARD_RADIUS = 60;
  COLLECTED_CARD_GAP = 20;
  PLAYER_LOCATION = {
    5: [
      {
        side: "bottom",
        location: 0.5,
        angle: PI * (3 / 2)
      }, {
        side: "left",
        location: 0.6,
        angle: PI * (3 / 2 - 2 / 5)
      }, {
        side: "top",
        location: 0.25,
        angle: PI * (3 / 2 - 4 / 5)
      }, {
        side: "top",
        location: 0.75,
        angle: PI * (3 / 2 - 6 / 5)
      }, {
        side: "right",
        location: 0.6,
        angle: PI * (3 / 2 - 8 / 5)
      }
    ],
    6: [
      {
        side: "bottom",
        location: 0.7,
        angle: PI * (1 + 1 / 3)
      }, {
        side: "bottom",
        location: 0.3,
        angle: PI * (1 + 2 / 3)
      }, {
        side: "left",
        location: 0.5,
        angle: PI * 2.
      }, {
        side: "top",
        location: 0.25,
        angle: PI * (2 + 1 / 3)
      }, {
        side: "top",
        location: 0.75,
        angle: PI * (2 + 1 / 3)
      }, {
        side: "right",
        location: 0.5,
        angle: PI * 1.
      }
    ]
  };
  DISAPPEAR_DIRECTION = {
    left: [-CARD_HEIGHT, 0],
    right: [CARD_HEIGHT, 0],
    top: [0, -CARD_HEIGHT],
    bottom: [0, CARD_HEIGHT]
  };
  SCORE_CARD_VALUES = "tjqk1";
  VALUE_ORDER = "23456789tjqk1";
  SUIT_NAMES = {
    s: "스페이드",
    h: "하트",
    c: "클로버",
    d: "다이아몬드",
    n: "노기루다",
    " ": "&nbsp;"
  };
  VALUE_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "잭", "퀸", "킹", "에이스"];
  floor = Math.floor;
  lexicographic_compare = function(a, b) {
    if (a === b) {
      return 0;
    } else if (a < b) {
      return -1;
    } else {
      return 1;
    }
  };
  assert = function(conditional, message) {
    if (message == null) {
      message = "";
    }
    if (!conditional) {
      console.log(message);
      return alert(message);
    }
  };
  Array.prototype.remove = function(elem) {
    return this.splice(this.indexOf(elem), 1)[0];
  };
  runInterval = function(interval, funcs) {
    var runner;
    runner = function() {
      funcs[0]();
      funcs.splice(0, 1);
      if (funcs.length > 0) {
        return setTimeout(runner, interval);
      }
    };
    return setTimeout(runner, interval);
  };
  renderFaceName = function(face) {
    var suit, value;
    suit = SUIT_NAMES[face[0]];
    value = VALUE_NAMES[VALUE_ORDER.indexOf(face[1])];
    return "" + suit + " " + value;
  };
  isScoreCard = function(face) {
    var _ref;
    return _ref = face[1], __indexOf.call(SCORE_CARD_VALUES, _ref) >= 0;
  };
  Card = (function() {
    function Card(playing_field, face, direction, x, y) {
      var size;
      this.playing_field = playing_field;
      this.face = face;
      this.direction = direction;
      this.elem = $(".card_template").clone().removeClass("card_template").addClass(this.face).addClass(this.direction).appendTo(this.playing_field.elem);
      size = this.getSize();
      this.elem.css("left", (x - floor(size.width / 2)) + "px").css("top", (y - floor(size.height / 2)) + "px");
      this.playing_field.addCard(this);
    }
    Card.prototype.getSize = function() {
      if (this.direction === "vertical") {
        return {
          width: CARD_WIDTH,
          height: CARD_HEIGHT
        };
      } else {
        return {
          width: CARD_HEIGHT,
          height: CARD_WIDTH
        };
      }
    };
    Card.prototype.moveTo = function(cx, cy, duration) {
      var left, sz, top;
      sz = this.getSize();
      left = cx - floor(sz.width / 2);
      top = cy - floor(sz.height / 2);
      return this.elem.animate({
        left: left,
        top: top
      }, duration);
    };
    Card.prototype.setFace = function(face) {
      this.elem.removeClass(this.face).addClass(face);
      return this.face = face;
    };
    Card.prototype.setDirection = function(direction) {
      this.elem.removeClass(this.direction).addClass(direction);
      return this.direction = direction;
    };
    Card.prototype.remove = function() {
      this.elem.remove();
      return null;
    };
    return Card;
  })();
  ChangePromiseHelper = (function() {
    function ChangePromiseHelper(suit, value, minTarget, elem, afterInit) {
      var self;
      this.minTarget = minTarget;
      this.elem = elem;
      if (afterInit == null) {
        afterInit = function() {};
      }
      this.selectedSuit = suit;
      this.selectedValue = value;
      this.minValue = value;
      this.updateSelected();
      this.elem.find(".plus_promise_button").unbind("click").click(__bind(function() {
        return this.setValue(Math.min(20, this.selectedValue + 1));
      }, this));
      this.elem.find(".minus_promise_button").unbind("click").click(__bind(function() {
        return this.setValue(Math.max(this.minValue, this.selectedValue - 1));
      }, this));
      this.elem.find(".value_select_buttons button").attr("disabled", "");
      self = this;
      this.elem.find(".select_suit button").unbind("mouseover").unbind("mouseout").unbind("click").mouseover(function() {
        self.showSuit(self.getSuit(this));
        return self.showValue(self.minTarget[self.getSuit(this)]);
      }).mouseout(__bind(function() {
        this.showSuit(this.selectedSuit);
        return this.showValue(this.selectedValue);
      }, this)).click(function() {
        self.elem.find(".select_suit button.selected").removeClass("selected");
        $(this).addClass("selected");
        self.setSuit(self.getSuit(this));
        return self.setValue(self.minValue);
      });
      this.setSuit(this.selectedSuit);
      this.setValue(this.selectedValue);
      console.log(this);
      afterInit();
    }
    ChangePromiseHelper.prototype.updateSelected = function() {
      this.elem.find(".select_suit button").removeClass("selected");
      return this.elem.find(".select_suit button." + this.selectedSuit).addClass("selected");
    };
    ChangePromiseHelper.prototype.showSuit = function(suit) {
      return this.elem.find(".selected .select_suit").html(SUIT_NAMES[suit]);
    };
    ChangePromiseHelper.prototype.setSuit = function(suit) {
      this.selectedSuit = suit;
      this.minValue = this.minTarget[this.selectedSuit];
      return this.showSuit(suit);
    };
    ChangePromiseHelper.prototype.showValue = function(val) {
      return this.elem.find(".selected .select_promise").html(val === 0 ? "" : val);
    };
    ChangePromiseHelper.prototype.setValue = function(val) {
      this.selectedValue = val;
      this.showValue(val);
      if (this.minTarget[this.selectedSuit] < this.selectedValue) {
        this.elem.find(".minus_promise_button").removeAttr("disabled");
      } else {
        this.elem.find(".minus_promise_button").attr("disabled", "");
      }
      if (this.selectedValue < 20) {
        return this.elem.find(".plus_promise_button").removeAttr("disabled");
      } else {
        return this.elem.find(".plus_promise_button").attr("disabled", "");
      }
    };
    ChangePromiseHelper.prototype.getSuit = function(button) {
      return $(button).attr("data-suit");
    };
    return ChangePromiseHelper;
  })();
  PlayingField = (function() {
    function PlayingField(elem) {
      this.elem = elem;
      this.setSortOrder = __bind(this.setSortOrder, this);
      this.cards = [];
      this.players = [];
      this.playedCards = [];
      this.collected = [];
      this.cardStack = [];
    }
    PlayingField.prototype.getLocationInfo = function(player) {
      return PLAYER_LOCATION[this.players.length][player];
    };
    PlayingField.prototype.getCardDirection = function(player) {
      var side;
      side = this.getLocationInfo(player).side;
      if (side === "top" || side === "bottom") {
        return "vertical";
      } else {
        return "horizontal";
      }
    };
    PlayingField.prototype.getCollectedPosition = function(player, index) {
      return this.getHandPosition(player, this.collected[player].length, index, COLLECTED_CARD_GAP);
    };
    PlayingField.prototype.getHandPosition = function(player, cards, index, adjust) {
      var adjustx, adjusty, cx, cy, dx, dy, fx, fy, location, side, totalWidth, _ref;
      if (adjust == null) {
        adjust = 0;
      }
      _ref = this.getLocationInfo(player), side = _ref.side, location = _ref.location;
      PLAYER_LOCATION[this.players.length][player];
      adjustx = adjusty = 0;
      dx = dy = 0;
      if (side === "top" || side === "bottom") {
        cx = this.convertRelativePosition(location, 0).x;
        if (side === "top") {
          cy = CARD_HEIGHT / 2;
          dx = -1;
          adjusty = adjust;
        } else {
          cy = this.getSize().height - CARD_HEIGHT / 2;
          dx = 1;
          adjusty = -adjust;
        }
      } else {
        cy = this.convertRelativePosition(0, location).y;
        if (side === "left") {
          cx = CARD_HEIGHT / 2;
          dy = 1;
          adjustx = adjust;
        } else {
          cx = this.getSize().width - CARD_HEIGHT / 2;
          dy = -1;
          adjustx = -adjust;
        }
      }
      totalWidth = CARD_WIDTH + (cards - 1) * CARD_OVERLAP;
      fx = cx + dx * (floor(totalWidth / 2) - CARD_WIDTH / 2) + adjustx;
      fy = cy + dy * (floor(totalWidth / 2) - CARD_WIDTH / 2) + adjusty;
      return {
        x: floor(fx - dx * CARD_OVERLAP * index),
        y: floor(fy - dy * CARD_OVERLAP * index)
      };
    };
    PlayingField.prototype.getProfilePosition = function(player) {
      var computedGap, height, location, side, width, _ref;
      _ref = this.getLocationInfo(player), side = _ref.side, location = _ref.location;
      width = side === "top" || side === "bottom" ? 254 : 200;
      height = side === "top" || side === "bottom" ? 50 : 104;
      computedGap = CARD_HEIGHT + PROFILE_CARD_GAP + COLLECTED_CARD_GAP;
      if (side === "top" || side === "bottom") {
        return {
          side: side,
          x: this.convertRelativePosition(location, 0).x - width / 2,
          y: side === "top" ? computedGap : this.getSize().height - height - computedGap
        };
      } else {
        return {
          side: side,
          y: this.convertRelativePosition(0, location).y - height / 2,
          x: side === "left" ? computedGap : this.getSize().width - width - computedGap
        };
      }
    };
    PlayingField.prototype.clearDialogs = function() {
      return $("#dialog > div").hide();
    };
    PlayingField.prototype.clearCards = function() {
      while (this.cards.length > 0) {
        this.cards.pop().remove();
      }
      return null;
    };
    PlayingField.prototype.getSize = function() {
      return {
        width: this.elem.width(),
        height: this.elem.height()
      };
    };
    PlayingField.prototype.addCard = function(card) {
      return this.cards.push(card);
    };
    PlayingField.prototype.convertRelativePosition = function(x, y) {
      var sz;
      sz = this.getSize();
      return {
        x: floor(sz.width * x),
        y: floor(sz.height * y)
      };
    };
    PlayingField.prototype.setSortOrder = function(faceOrder) {
      return this.sortOrder = faceOrder;
    };
    PlayingField.prototype.sortHands = function(player) {
      var faceOrder, i, n;
      faceOrder = this.sortOrder;
      if (faceOrder == null) {
        faceOrder = "jsdch";
      }
      if (this.hands[player].length === 0 || this.hands[player][0].face[0] === "b") {
        return;
      }
      this.hands[player].sort(function(a, b) {
        if (a.face[0] !== b.face[0]) {
          return -(faceOrder.indexOf(a.face[0]) - faceOrder.indexOf(b.face[0]));
        } else {
          return VALUE_ORDER.indexOf(a.face[1]) - VALUE_ORDER.indexOf(b.face[1]);
        }
      });
      n = this.hands[player].length;
      for (i = 0; 0 <= n ? i < n : i > n; 0 <= n ? i++ : i--) {
        this.hands[player][i].elem.css({
          "z-index": n - i + 20
        });
      }
      return this.repositionCards(player);
    };
    PlayingField.prototype.createCardsFromFace = function(faces, player) {
      var card, cards, center, face, _i, _len;
      if (player == null) {
        player = null;
      }
      center = this.convertRelativePosition(0.5, 0.5);
      cards = [];
      for (_i = 0, _len = faces.length; _i < _len; _i++) {
        face = faces[_i];
        card = new Card(this, face, "vertical", center.x, center.y);
        if (player != null) {
          card.setDirection(this.getCardDirection(player));
        }
        card.elem.show();
        cards.push(card);
      }
      return cards;
    };
    PlayingField.prototype.deal = function(cards, startFrom, done) {
      var card, center, i;
      if (done == null) {
        done = function() {};
      }
      this.clearCards();
      assert(cards.length === this.players.length, "플레이어 수와 나눠줄 카드 덱 수가 동일해야함");
      this.hands = (function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = this.players.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          _results.push([]);
        }
        return _results;
      }).call(this);
      this.collected = (function() {
        var _ref, _results;
        _results = [];
        for (i = 0, _ref = this.players.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          _results.push([]);
        }
        return _results;
      }).call(this);
      center = this.convertRelativePosition(0.5, 0.5);
      this.cardStack = [];
      for (i = 0; i <= 52; i++) {
        card = new Card(this, "back", "vertical", center.x, center.y - floor(i / 4) * 2);
        card.elem.addClass("group" + (floor(i / 4) % 2)).delay(i * SPEED_BASE / 10).fadeIn(0);
        this.cardStack.push(card);
      }
      this.cardStack[52].elem.promise().done(__bind(function() {
        var i;
        for (i = 0; i <= 0; i++) {
          $(".group0").animate({
            left: "-=37"
          }, SPEED_BASE * 3).animate({
            top: "-=2"
          }, 0).animate({
            left: "+=74"
          }, SPEED_BASE * 6).animate({
            top: "+=2"
          }, 0).animate({
            left: "-=37"
          }, SPEED_BASE * 3);
          $(".group1").animate({
            left: "+=37"
          }, SPEED_BASE * 3).animate({
            top: "+=2"
          }, 0).animate({
            left: "-=74"
          }, SPEED_BASE * 6).animate({
            top: "-=2"
          }, 0).animate({
            left: "+=37"
          }, SPEED_BASE * 3);
        }
        $(".group1").promise().done(__bind(function() {
          var dealt, face, index, pl, player, _fn, _ref, _ref2;
          dealt = 0;
          for (index = 0, _ref = cards[0].length; 0 <= _ref ? index < _ref : index > _ref; 0 <= _ref ? index++ : index--) {
            _fn = __bind(function(card, face, player, index, dealt) {
              return setTimeout(__bind(function() {
                var pos;
                card.setFace(face);
                card.setDirection(this.getCardDirection(player));
                pos = this.getHandPosition(player, cards[0].length, index);
                card.moveTo(pos.x, pos.y, SPEED_BASE);
                return null;
              }, this), dealt * SPEED_BASE);
            }, this);
            for (pl = 0, _ref2 = this.players.length; 0 <= _ref2 ? pl < _ref2 : pl > _ref2; 0 <= _ref2 ? pl++ : pl--) {
              player = (startFrom + pl) % this.players.length;
              card = this.cardStack.pop();
              this.hands[player].push(card);
              face = cards[player][index];
              _fn(card, face, player, index, dealt);
              dealt++;
            }
          }
          setTimeout(__bind(function() {
            var i, player, _ref3, _ref4;
            for (i = 0, _ref3 = this.cardStack.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
              this.cardStack[i].elem.animate({
                top: "-=" + (i * 2),
                left: "-=" + (i * 2)
              }, 50);
            }
            for (player = 0, _ref4 = this.players.length; 0 <= _ref4 ? player < _ref4 : player > _ref4; 0 <= _ref4 ? player++ : player--) {
              this.sortHands(player);
            }
            return null;
          }, this), dealt * SPEED_BASE);
          setTimeout(done, dealt * SPEED_BASE);
          return null;
        }, this));
        return null;
      }, this));
      return null;
    };
    PlayingField.prototype.repositionCards = function(player) {
      var i, pos, _ref, _results;
      _results = [];
      for (i = 0, _ref = this.hands[player].length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        pos = this.getHandPosition(player, this.hands[player].length, i);
        _results.push(this.hands[player][i].moveTo(pos.x, pos.y, SPEED_BASE * 5));
      }
      return _results;
    };
    PlayingField.prototype.dealAdditionalCards = function(faces, player, done) {
      var card, idx, n, _fn;
      if (done == null) {
        done = function() {};
      }
      n = faces.length;
      _fn = __bind(function(idx, card) {
        return setTimeout(__bind(function() {
          card.setFace(faces[idx]);
          card.setDirection(this.getCardDirection(player));
          this.hands[player].push(card);
          this.repositionCards(player);
          return null;
        }, this), idx * SPEED_BASE * 5);
      }, this);
      for (idx = 0; 0 <= n ? idx < n : idx > n; 0 <= n ? idx++ : idx--) {
        if (!(this.cardStack != null) || this.cardStack.length === 0) {
          this.cardStack = [];
          card = new Card(this, "back", "vertical", center.x, center.y);
          card.elem.fadeIn(0);
          this.cardStack.push(card);
        }
        card = this.cardStack.pop();
        _fn(idx, card);
      }
      setTimeout(__bind(function() {
        this.sortHands(player);
        return done();
      }, this), n * SPEED_BASE * 5);
      return null;
    };
    PlayingField.prototype.globalMessage = function(message, fadeOutAfter) {
      if (fadeOutAfter == null) {
        fadeOutAfter = 5000;
      }
      return $("#global_message").hide().clearQueue().html(message).fadeIn(500).delay(fadeOutAfter).fadeOut(500);
    };
    PlayingField.prototype.clearPlayerMessages = function() {
      var i, _results;
      _results = [];
      for (i = 0; i < 5; i++) {
        _results.push(this.playerMessage(i, "", ""));
      }
      return _results;
    };
    PlayingField.prototype.playerMessage = function(player, type, message) {
      var elem;
      if (message == null) {
        message = "";
      }
      elem = this.players[player].profile_elem;
      elem.find("dd").clearQueue().stop().animate({
        "background-color": "rgba(255, 255, 255, 0.8)"
      }, 150).animate({
        "background-color": "rgba(0, 0, 0, 0.1)"
      }, 4000);
      elem.find(".message_type").html(type);
      return elem.find(".message_content").html(message);
    };
    PlayingField.prototype.setPlayers = function(players) {
      var elem, i, player, side, x, y, _i, _len, _ref, _ref2, _ref3, _results;
      if (this.players) {
        _ref = this.players;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          player = _ref[_i];
          player.profile_elem.remove();
        }
      }
      this.players = players;
      _results = [];
      for (i = 0, _ref2 = this.players.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        _ref3 = this.getProfilePosition(i), side = _ref3.side, y = _ref3.y, x = _ref3.x;
        elem = $(".profile_template").clone().removeClass("profile_template").addClass(side).appendTo(this.elem);
        elem.find(".picture").attr({
          src: this.players[i].picture
        });
        elem.find(".name").html(this.players[i].name);
        elem.css({
          left: x,
          top: y
        });
        elem.show();
        _results.push(this.players[i].profile_elem = elem);
      }
      return _results;
    };
    PlayingField.prototype.setPlayerType = function(player, typeName) {
      var elem;
      this.players[player].profile_elem.find(".type").html(typeName).addClass(typeName);
      elem = this.players[player].profile_elem;
      if (typeName.indexOf("주공") !== -1 || typeName.indexOf("프렌드") !== -1) {
        return elem.addClass('ruler');
      } else {
        return elem.removeClass('ruler');
      }
    };
    PlayingField.prototype.playCard = function(player, card, render_as) {
      var c, face, _i, _len, _ref;
      if (render_as == null) {
        render_as = null;
      }
      if (typeof card === "string") {
        face = card;
        card = null;
        _ref = this.hands[player];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          if (c.face === face) {
            card = c;
            break;
          }
        }
      }
      if (card === null) {
        card = this.hands[player].pop();
        card.setFace(face);
      } else {
        this.hands[player].remove(card);
      }
      this.playedCards.push(card);
      this.playerMessage(player, "플레이", render_as || renderFaceName(card.face));
      this.repositionCards(player);
      card.elem.css("z-index", this.playedCards.length);
      card.setDirection("vertical");
      return this.moveToPlayedPosition(player, card);
    };
    PlayingField.prototype.moveToPlayedPosition = function(player, card) {
      var angle, center, x, y;
      angle = this.getLocationInfo(player).angle;
      center = this.convertRelativePosition(0.5, 0.5);
      x = center.x + Math.cos(angle) * PLAYED_CARD_RADIUS;
      y = center.y - Math.sin(angle) * PLAYED_CARD_RADIUS;
      return card.moveTo(x, y, SPEED_BASE * 5);
    };
    PlayingField.prototype.displayPlayerInAction = function(index) {
      var player, _i, _len, _ref;
      _ref = this.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        player = _ref[_i];
        player.profile_elem.removeClass('in_action');
      }
      return this.players[index].profile_elem.addClass('in_action');
    };
    PlayingField.prototype.endTurn = function(winner, collectCards) {
      var card, collect, take, _i, _len, _ref;
      if (collectCards == null) {
        collectCards = false;
      }
      take = [];
      collect = [];
      _ref = this.playedCards;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        if (isScoreCard(card.face) && collectCards) {
          collect.push(card);
        } else {
          take.push(card);
        }
      }
      this.playerMessage(winner, "턴 승리", "이 턴을 승리!");
      this.takeCards(winner, take);
      this.collectCards(winner, collect);
      return this.playedCards = [];
    };
    PlayingField.prototype.removeCollectedCards = function(player) {
      var card, _i, _len, _ref;
      _ref = this.collected[player];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        card.remove();
      }
      return this.collected[player] = [];
    };
    PlayingField.prototype.collectCards = function(player, cards) {
      var card, index, pos, _i, _j, _len, _len2, _ref, _results;
      for (_i = 0, _len = cards.length; _i < _len; _i++) {
        card = cards[_i];
        this.collected[player].push(card);
      }
      index = 0;
      _ref = this.collected[player];
      _results = [];
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        card = _ref[_j];
        card.setDirection(this.getCardDirection(player));
        pos = this.getCollectedPosition(player, index);
        card.moveTo(pos.x, pos.y, SPEED_BASE * 5);
        card.elem.css({
          "z-index": this.collected[player].length - index
        });
        _results.push(index += 1);
      }
      return _results;
    };
    PlayingField.prototype.takeCards = function(player, cards, done) {
      var cx, cy, dx, dy, e, home, i, _ref, _ref2;
      if (done == null) {
        done = function() {};
      }
      home = this.getHandPosition(player, 1, 0);
      _ref = DISAPPEAR_DIRECTION[this.getLocationInfo(player).side], dx = _ref[0], dy = _ref[1];
      cx = home.x + dx;
      cy = home.y + dy;
      for (i = 0, _ref2 = cards.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        e = cards[i].elem;
        cards[i].elem.animate({
          top: cy,
          left: cx
        }, SPEED_BASE * 5).fadeOut(0, function() {
          return e.remove();
        });
      }
      return setTimeout(__bind(function() {
        return done();
      }, this), SPEED_BASE * 5);
    };
    PlayingField.prototype.setPlayerListHandler = function(handler) {
      return $("#player_list_dialog .ready").unbind("click").click(handler);
    };
    PlayingField.prototype.showPlayerList = function() {
      return $("#player_list_dialog").show();
    };
    PlayingField.prototype.hidePlayerList = function() {
      return $("#player_list_dialog").hide();
    };
    PlayingField.prototype.addPlayerToList = function(index, name, image) {
      var elem;
      elem = $("#player_list_dialog").find("li").eq(index);
      if (image === "") {
        image = "static/guest.png";
      }
      if (elem != null) {
        elem.find(".picture").attr({
          src: image
        });
        elem.find(".name").html(name);
        elem.find(".type").text("");
        return elem.find(".message_content").text("전적 없음");
      }
    };
    PlayingField.prototype.clearPlayerList = function() {
      var i, _results;
      _results = [];
      for (i = 0; i < 5; i++) {
        _results.push(this.removePlayerFromList(i));
      }
      return _results;
    };
    PlayingField.prototype.removePlayerFromList = function(index) {
      var elem;
      elem = $("#player_list_dialog").find("li").eq(index);
      if (elem != null) {
        elem.find(".picture").attr({
          src: "static/question.png"
        });
        elem.find(".name").html("");
        elem.find(".type").text("빈 자리");
        return elem.find(".message_content").text("");
      }
    };
    PlayingField.prototype.chooseSuit = function(giru, done) {
      var finish;
      if (done == null) {
        done = function() {};
      }
      finish = __bind(function(suit) {
        $("#choose_suit_dialog").hide();
        return done(suit);
      }, this);
      $("#choose_suit_dialog .g").unbind("click").click(function() {
        return finish(giru);
      });
      $("#choose_suit_dialog .c").unbind("click").click(function() {
        return finish('c');
      });
      $("#choose_suit_dialog .d").unbind("click").click(function() {
        return finish('d');
      });
      $("#choose_suit_dialog .s").unbind("click").click(function() {
        return finish('s');
      });
      $("#choose_suit_dialog .h").unbind("click").click(function() {
        return finish('h');
      });
      $("#choose_suit_dialog .cancel").unbind("click").click(function() {
        return finish();
      });
      return $("#choose_suit_dialog").fadeIn(100);
    };
    PlayingField.prototype.chooseCard = function(done) {
      var baseY, card, finish, player, _i, _len, _ref, _results;
      if (done == null) {
        done = function() {};
      }
      player = 0;
      baseY = this.getHandPosition(player, 1, 0).y - CARD_HEIGHT / 2;
      finish = __bind(function(card) {
        var c, _i, _len, _ref;
        _ref = this.hands[player];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          c.elem.removeClass("canChoose").unbind();
        }
        return done(card);
      }, this);
      _ref = this.hands[player];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        _results.push(__bind(function(card) {
          return card.elem.addClass("canChoose").mouseover(function() {
            return $(this).animate({
              top: baseY - 10 + "px"
            }, SPEED_BASE);
          }).mouseout(function() {
            return $(this).animate({
              top: baseY + "px"
            }, SPEED_BASE);
          }).mousedown(function() {
            return finish(card);
          });
        }, this)(card));
      }
      return _results;
    };
    PlayingField.prototype.chooseFilteredCard = function(filter, done) {
      var baseY, card, finish, player, _i, _len, _ref, _results;
      if (done == null) {
        done = function() {};
      }
      player = 0;
      baseY = this.getHandPosition(player, 1, 0).y - CARD_HEIGHT / 2;
      finish = __bind(function(card) {
        var c, _i, _len, _ref;
        _ref = this.hands[player];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          c.elem.removeClass("canChoose").unbind();
        }
        return done(card);
      }, this);
      _ref = this.hands[player];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        _results.push(__bind(function(card) {
          if (filter(card)) {
            return card.elem.addClass("canChoose").mouseover(function() {
              return $(this).animate({
                top: baseY - 10 + "px"
              }, SPEED_BASE);
            }).mouseout(function() {
              return $(this).animate({
                top: baseY + "px"
              }, SPEED_BASE);
            }).mousedown(function() {
              return finish(card);
            });
          }
        }, this)(card));
      }
      return _results;
    };
    PlayingField.prototype.chooseMultipleCards = function(choose, suit, target, minTarget, done) {
      var baseY, card, finished, getHandlers, handlers, helper, multiple, originalSuit, originalValue, player, _i, _len, _ref;
      if (done == null) {
        done = function() {};
      }
      player = 0;
      baseY = this.getHandPosition(player, 1, 0).y - CARD_HEIGHT / 2;
      this.chosen = [];
      multiple = $("#choose_multiple");
      $("#choose_multiple .open_change_promise").unbind().click(function() {
        return multiple.addClass("enable_change_promise");
      });
      multiple.find(".choose_count").html(choose);
      multiple.fadeIn(500);
      if (!(minTarget != null)) {
        if (suit === 'n') {
          minTarget = {
            n: target,
            s: Math.min(target + 1, 20),
            d: Math.min(target + 1, 20),
            c: Math.min(target + 1, 20),
            h: Math.min(target + 1, 20)
          };
        } else {
          minTarget = {
            n: Math.min(target + 1, 20),
            s: Math.min(target + 2, 20),
            d: Math.min(target + 2, 20),
            c: Math.min(target + 2, 20),
            h: Math.min(target + 2, 20)
          };
          minTarget[suit] = target;
        }
      }
      helper = new ChangePromiseHelper(suit, target, minTarget, $("#choose_multiple"));
      finished = __bind(function() {
        var card, _i, _len, _ref;
        if (this.chosen.length !== choose) {
          return;
        }
        multiple.fadeOut(500);
        multiple.removeClass("enable_change_promise");
        _ref = this.hands[player];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          card.elem.removeClass("canChoose").unbind();
        }
        return done(this.chosen, helper.selectedSuit, helper.selectedValue);
      }, this);
      originalSuit = suit;
      originalValue = target;
      multiple.find(".reset_promise").unbind().click(function() {
        helper.setSuit(originalSuit);
        helper.setValue(originalValue);
        return helper.updateSelected();
      });
      getHandlers = __bind(function(card) {
        var deraise, raise, raised;
        raised = false;
        raise = function() {
          if (!raised) {
            raised = true;
            return card.elem.animate({
              top: baseY - 10 + "px"
            }, SPEED_BASE);
          }
        };
        deraise = function() {
          if (raised) {
            raised = false;
            return card.elem.animate({
              top: baseY + "px"
            }, SPEED_BASE);
          }
        };
        return {
          onMouseOver: __bind(function() {
            if (this.chosen.length < choose && __indexOf.call(this.chosen, card) < 0) {
              return raise();
            }
          }, this),
          onMouseDown: __bind(function() {
            if (this.chosen.length < choose && __indexOf.call(this.chosen, card) < 0) {
              this.chosen.push(card);
              card.elem.addClass("chosen");
              raise();
            } else if (__indexOf.call(this.chosen, card) >= 0) {
              this.chosen.remove(card);
              card.elem.removeClass("chosen");
              deraise();
            }
            if (this.chosen.length === choose) {
              return multiple.find("button.confirm").removeAttr("disabled").unbind().click(finished);
            } else {
              return multiple.find("button.confirm").attr("disabled", "");
            }
          }, this),
          onMouseOut: __bind(function() {
            if (__indexOf.call(this.chosen, card) < 0) {
              return deraise();
            }
          }, this)
        };
      }, this);
      _ref = this.hands[player];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        console.log(card);
        handlers = getHandlers(card);
        card.elem.addClass("canChoose").mouseover(handlers.onMouseOver).mousedown(handlers.onMouseDown).mouseout(handlers.onMouseOut);
      }
      return null;
    };
    PlayingField.prototype.confirmYesNo = function(question, yesName, noName, callback) {
      var handler;
      if (callback == null) {
        callback = function(res) {};
      }
      $("#confirm_dialog .title").html(question);
      $("#confirm_dialog .confirm").text(yesName);
      $("#confirm_dialog .cancel").text(noName);
      handler = function(yesno) {
        $("#confirm_dialog").hide();
        return callback(yesno);
      };
      $("#confirm_dialog .confirm").unbind().click(function() {
        return handler(true);
      });
      $("#confirm_dialog .cancel").unbind().click(function() {
        return handler(false);
      });
      return $("#confirm_dialog").fadeIn(100);
    };
    PlayingField.prototype.showDealMissHand = function(hand, name) {
      var DealmissField, c, card, dealmissField, faceOrder, p, _i, _len, _results;
      if (name == null) {
        name = "김딜미";
      }
      $("#dealmiss_dialog .you").text(name);
      faceOrder = "jsdch";
      hand.sort(function(a, b) {
        if (a[0] !== b[0]) {
          return -(faceOrder.indexOf(a[0]) - faceOrder.indexOf(b[0]));
        } else {
          return VALUE_ORDER.indexOf(a[1]) - VALUE_ORDER.indexOf(b[1]);
        }
      });
      DealmissField = (function() {
        function DealmissField(elem) {
          this.elem = elem;
          this.cards = [];
        }
        DealmissField.prototype.addCard = function(card) {
          this.cards.push(card);
          return card.elem.css("z-index", this.cards.length + 100).delay(50 * this.cards.length + 100).fadeIn(100);
        };
        DealmissField.prototype.clear = function() {
          var card, _i, _len, _ref;
          _ref = this.cards;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            card = _ref[_i];
            card.remove();
          }
          return this.cards = [];
        };
        return DealmissField;
      })();
      dealmissField = new DealmissField($("#dealmiss_dialog .cards"));
      $("#dealmiss_dialog .close").unbind().click(function() {
        $("#dealmiss_dialog").hide().clearQueue();
        return dealmissField.clear();
      });
      $("#dealmiss_dialog").fadeIn(100).delay(5000).fadeOut(100, function() {
        return dealmissField.clear();
      });
      p = {
        left: 0,
        top: 0
      };
      _results = [];
      for (_i = 0, _len = hand.length; _i < _len; _i++) {
        c = hand[_i];
        card = new Card(dealmissField, c, "vertical", p.left + CARD_WIDTH / 2, p.top + CARD_HEIGHT / 2);
        _results.push(p.left += CARD_OVERLAP);
      }
      return _results;
    };
    PlayingField.prototype.prompt = function(question, defaultValue, callback) {
      var handler;
      if (defaultValue == null) {
        defaultValue = null;
      }
      if (callback == null) {
        callback = function(res) {};
      }
      if (defaultValue == null) {
        defaultValue = "";
      }
      $("#prompt_dialog .title").text(question);
      $("#prompt_dialog .value").val(defaultValue);
      handler = function() {
        var ret;
        ret = $("#prompt_dialog .value").val();
        if (ret === "") {
          return;
        }
        $("#prompt_dialog").hide();
        return callback(ret);
      };
      $("#prompt_dialog .value").unbind("keypress").keypress(function(e) {
        if (e.keyCode === 13) {
          return handler();
        }
      });
      $("#prompt_dialog .confirm").unbind("click").click(handler);
      $("#prompt_dialog").fadeIn(100);
      return $("#prompt_dialog .value").focus();
    };
    PlayingField.prototype.scrollChatToEnd = function() {
      return $("#chatbox .content").scrollTop($("#chatbox .content").prop("scrollHeight"));
    };
    PlayingField.prototype.addChatHTML = function(name, msg) {
      if (name === "") {
        $("#chatbox .content").append(msg + "<BR>");
      } else {
        $("#chatbox .content").append(name + ": " + msg + "<BR>");
      }
      return this.scrollChatToEnd();
    };
    PlayingField.prototype.addChatMessage = function(name, msg) {
      msg = $("#chatbox .escaper").text(msg).html();
      $("#chatbox .content").append(name + ": " + msg + "<BR>");
      return this.scrollChatToEnd();
    };
    PlayingField.prototype.setChatHandler = function(handler) {
      return $("#chatbox .value").unbind("keypress").keypress(function(e) {
        var ret;
        if (e.keyCode === 13) {
          ret = $("#chatbox .value").val();
          $("#chatbox .value").val("");
          if (ret === "") {
            return;
          }
          return handler(ret);
        }
      });
    };
    PlayingField.prototype.setAnimationOn = function() {
      return SPEED_BASE = DEFAULT_SPEED_BASE;
    };
    PlayingField.prototype.setAnimationOff = function() {
      return SPEED_BASE = 0;
    };
    PlayingField.prototype.setStatusBar = function(htmlTxt) {
      var buildMinimizedCardHtml, l, r, _ref;
      buildMinimizedCardHtml = function(face, content) {
        if (content == null) {
          content = "";
        }
        return '<span class="smallcard inline ' + face + '">' + content + '</span>';
      };
      if (typeof htmlTxt === "function") {
        _ref = htmlTxt(buildMinimizedCardHtml), l = _ref[0], r = _ref[1];
        if (l == null) {
          l = "";
        }
        if (r == null) {
          r = "";
        }
        $("#statusbar .left").html(l);
        return $("#statusbar .right").html(r);
      } else {
        $("#statusbar .left").html(htmlTxt);
        return $("#statusbar .right").html("");
      }
    };
    PlayingField.prototype.choosePromise = function(minNoGiru, minOthers, canDealMiss, defaultSuit, defaultValue, callback) {
      var finish, helper, minTarget;
      if (defaultSuit == null) {
        defaultSuit = " ";
      }
      if (defaultValue == null) {
        defaultValue = 0;
      }
      if (callback == null) {
        callback = function(res) {};
      }
      minTarget = {
        n: minNoGiru,
        s: minOthers,
        d: minOthers,
        c: minOthers,
        h: minOthers
      };
      helper = new ChangePromiseHelper(defaultSuit, defaultValue, minTarget, $("#choose_promise_dialog"), function() {
        return $("#choose_promise_dialog .confirm").removeAttr("disabled");
      });
      finish = function(res) {
        $("#choose_promise_dialog").hide();
        return callback(res);
      };
      $("#promise_confirm_button").unbind("click").click(function() {
        return finish({
          "result": "confirm",
          "suit": helper.selectedSuit,
          "value": helper.selectedValue
        });
      });
      $("#promise_pass_button").unbind("click").click(function() {
        return finish({
          "result": "pass"
        });
      });
      $("#promise_dealmiss_button").unbind("click").click(function() {
        return finish({
          "result": "dealmiss"
        });
      });
      $("#choose_promise_dialog .confirm").attr("disabled", "");
      if (canDealMiss) {
        $("#promise_dealmiss_button").show();
      } else {
        $("#promise_dealmiss_button").hide();
      }
      return $("#choose_promise_dialog").fadeIn(100);
    };
    return PlayingField;
  })();
  field = null;
  TEST_CARDS = [["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3", "s4", "c3"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]];
  TEST_CARDS6 = [["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3"], ["back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back"]];
  $(document).ready(function() {
    var GAP;
    window.field = new PlayingField($("#playing_field"));
    $("#option_buttons .toggle_sound").click(function() {
      var v;
      v = $("#option_buttons .toggle_sound").text();
      if (v === "mute") {
        $("#option_buttons .toggle_sound").text("unmute");
        return $("#option_buttons").find("audio").prop({
          muted: true
        });
      } else {
        $("#option_buttons .toggle_sound").text("mute");
        return $("#option_buttons").find("audio").prop({
          muted: false
        });
      }
    });
    $("#option_buttons .toggle_animation").click(function() {
      var v;
      v = $("#option_buttons .toggle_animation").text();
      if (v === "animation off") {
        window.field.setAnimationOff();
        return $("#option_buttons .toggle_animation").text("animation on");
      } else {
        window.field.setAnimationOn();
        return $("#option_buttons .toggle_animation").text("animation off");
      }
    });
    $("#chatbox .toggle_size").unbind().click(function() {
      if ($("#chatbox").width() === 400) {
        $("#chatbox").width(200);
        $("#chatbox .toggle_size").text('>');
        return window.field.scrollChatToEnd();
      } else {
        $("#chatbox").width(400);
        $("#chatbox .toggle_size").text('<');
        return window.field.scrollChatToEnd();
      }
    });
    $("#chatbox .toggle_member_list").unbind().click(function() {
      $("#chatbox .member_list").toggle();
      if ($("#chatbox .content").hasClass("reduced")) {
        $("#chatbox .content").removeClass("reduced");
      } else {
        $("#chatbox .content").addClass("reduced");
      }
      return window.field.scrollChatToEnd();
    });
    if (window.LIBGAME != null) {
      return;
    }
    window.field.setPlayers([
      {
        name: "JongMan Koo",
        picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/49218_593417379_9696_q.jpg"
      }, {
        name: "JongMan2 Koo",
        picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/49218_593417379_9696_q.jpg"
      }, {
        name: "Wonha Ryu",
        picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/41489_100000758278961_2887_q.jpg"
      }, {
        name: "Jinho Kim",
        picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/161338_100000247121062_7309182_q.jpg"
      }, {
        name: "DoKyoung Lee",
        picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/273911_100001947905915_2944452_q.jpg"
      }, {
        name: "Hyun-hwan Jung",
        picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/202947_100002443708928_4531642_q.jpg"
      }
    ]);
    window.field.globalMessage("새 게임을 시작합니다");
    GAP = SPEED_BASE * 20;
    return window.field.deal(TEST_CARDS6, 1, function() {
      window.field.globalMessage("선거가 시작됩니다!");
      setTimeout(function() {
        return window.field.playerMessage(1, "패스");
      }, GAP);
      setTimeout(function() {
        return window.field.playerMessage(2, "공약", "다이아몬드 14");
      }, GAP * 2);
      setTimeout(function() {
        return window.field.playerMessage(3, "공약", "클로버 15");
      }, GAP * 3);
      setTimeout(function() {
        return window.field.playerMessage(4, "패스");
      }, GAP * 4);
      setTimeout(function() {
        return window.field.playerMessage(0, "공약", "스페이드 16");
      }, GAP * 5);
      setTimeout(function() {
        return window.field.playerMessage(2, "패스");
      }, GAP * 6);
      setTimeout(function() {
        window.field.playerMessage(3, "패스");
        window.field.globalMessage("JongMan Koo 님이 당선되었습니다!");
        window.field.playerMessage(0, "당선", "스페이드 16");
        return window.field.setPlayerType(0, "주공");
      }, GAP * 7);
      return setTimeout(function() {
        /*
        				window.field.dealAdditionalCards(["back", "back", "back"], 1,
        				->
        					window.field.takeCards(1, (window.field.hands[1].pop() for i in [0..2]))
        				)
        				*/        return window.field.dealAdditionalCards(["sq", "jr", "hk"], 0, function() {
          window.field.globalMessage("JongMan Koo님이 당을 재정비하고 있습니다.");
          return window.field.chooseMultipleCards(3, 's', 16, function(chosen) {
            return window.field.takeCards(0, chosen, function() {
              var card, _i, _len;
              for (_i = 0, _len = chosen.length; _i < _len; _i++) {
                card = chosen[_i];
                window.field.hands[0].remove(card);
              }
              window.field.repositionCards(0);
              window.field.globalMessage("1턴이 시작되었습니다 !");
              window.field.playerMessage(0, "플레이", "차례입니다.");
              return window.field.chooseCard(function(card) {
                console.log("will play", card.face);
                window.field.playCard(0, "jr", "기루다 컴!");
                return runInterval(GAP, [
                  function() {
                    return window.field.playCard(1, "ct");
                  }, function() {
                    return window.field.playCard(2, "sj");
                  }, function() {
                    return window.field.playCard(3, "c2");
                  }, function() {
                    return window.field.playCard(4, "st");
                  }, function() {
                    return window.field.endTurn(0, false);
                  }
                ]);
              });
            });
          });
        });
      }, GAP * 8);
    });
  });
}).call(this);
