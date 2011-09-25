(function() {
  var CARD_HEIGHT, CARD_OVERLAP, CARD_WIDTH, Card, DISAPPEAR_DIRECTION, PI, PLAYED_CARD_RADIUS, PLAYER_LOCATION, PROFILE_CARD_GAP, PROFILE_WIDTH, PlayingField, SCORE_CARD_VALUES, SPEED_BASE, SUIT_NAMES, TEST_CARDS, VALUE_NAMES, VALUE_ORDER, assert, field, floor, isScoreCard, lexicographic_compare, renderFaceName, runInterval;
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
  SPEED_BASE = 50;
  PI = Math.PI;
  PLAYED_CARD_RADIUS = 60;
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
      this.elem = $("#card_template").clone().addClass(this.face).addClass(this.direction).appendTo(this.playing_field.elem);
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
  PlayingField = (function() {
    function PlayingField(elem) {
      this.elem = elem;
      this.cards = [];
      this.players = [];
      this.playedCards = [];
      this.collected = [];
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
      return this.getHandPosition(player, 14, index + 15);
    };
    PlayingField.prototype.getHandPosition = function(player, cards, index) {
      var cx, cy, dx, dy, fx, fy, location, side, totalWidth, _ref;
      _ref = this.getLocationInfo(player), side = _ref.side, location = _ref.location;
      PLAYER_LOCATION[this.players.length][player];
      dx = dy = 0;
      if (side === "top" || side === "bottom") {
        cx = this.convertRelativePosition(location, 0).x;
        if (side === "top") {
          cy = CARD_HEIGHT / 2;
          dx = -1;
        } else {
          cy = this.getSize().height - CARD_HEIGHT / 2;
          dx = 1;
        }
      } else {
        cy = this.convertRelativePosition(0, location).y;
        if (side === "left") {
          cx = CARD_HEIGHT / 2;
          dy = 1;
        } else {
          cx = this.getSize().width - CARD_HEIGHT / 2;
          dy = -1;
        }
      }
      totalWidth = CARD_WIDTH + (cards - 1) * CARD_OVERLAP;
      fx = cx + dx * (floor(totalWidth / 2) - CARD_WIDTH / 2);
      fy = cy + dy * (floor(totalWidth / 2) - CARD_WIDTH / 2);
      return {
        x: floor(fx - dx * CARD_OVERLAP * index),
        y: floor(fy - dy * CARD_OVERLAP * index)
      };
    };
    PlayingField.prototype.getProfilePosition = function(player) {
      var height, location, side, width, _ref;
      _ref = this.getLocationInfo(player), side = _ref.side, location = _ref.location;
      width = side === "top" || side === "bottom" ? 254 : 200;
      height = side === "top" || side === "bottom" ? 50 : 104;
      if (side === "top" || side === "bottom") {
        return {
          side: side,
          x: this.convertRelativePosition(location, 0).x - width / 2,
          y: side === "top" ? CARD_HEIGHT + PROFILE_CARD_GAP : this.getSize().height - CARD_HEIGHT - PROFILE_CARD_GAP - height
        };
      } else {
        return {
          side: side,
          y: this.convertRelativePosition(0, location).y - height / 2,
          x: side === "left" ? CARD_HEIGHT + PROFILE_CARD_GAP : this.getSize().width - CARD_HEIGHT - PROFILE_CARD_GAP - width
        };
      }
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
    PlayingField.prototype.sortHands = function(player) {
      var i, n;
      if (this.hands[player].length === 0 || this.hands[player][0].face[0] === "b") {
        return;
      }
      this.hands[player].sort(function(a, b) {
        if (a.face[0] !== b.face[0]) {
          return lexicographic_compare(a.face[0], b.face[0]);
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
      assert(cards.length === this.players.length);
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
      assert(n === this.cardStack.length);
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
        elem = $("#profile_template").clone().addClass(side).appendTo(this.elem);
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
      return this.players[player].profile_elem.find(".type").html(typeName).addClass(typeName);
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
      this.playerMessage(winner, "턴 승리", "이 턴을 승리하였습니다!");
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
      var card, pos, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = cards.length; _i < _len; _i++) {
        card = cards[_i];
        this.collected[player].push(card);
        pos = this.getCollectedPosition(player, this.collected[player].length - 1);
        card.moveTo(pos.x, pos.y, SPEED_BASE * 5);
        _results.push(card.elem.css({
          "z-index": this.collected[player].length
        }));
      }
      return _results;
    };
    PlayingField.prototype.takeCards = function(player, cards, done) {
      var cx, cy, dx, dy, home, i, _ref, _ref2;
      if (done == null) {
        done = function() {};
      }
      home = this.getHandPosition(player, 1, 0);
      _ref = DISAPPEAR_DIRECTION[this.getLocationInfo(player).side], dx = _ref[0], dy = _ref[1];
      cx = home.x + dx;
      cy = home.y + dy;
      for (i = 0, _ref2 = cards.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        cards[i].elem.animate({
          top: cy,
          left: cx
        }, SPEED_BASE * 5).fadeOut(0);
      }
      return setTimeout(__bind(function() {
        var card, _i, _len;
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
          card = cards[_i];
          card.remove();
        }
        return done();
      }, this), SPEED_BASE * 5);
    };
    PlayingField.prototype.chooseCard = function(done) {
      var card, finish, player, _i, _len, _ref, _results;
      if (done == null) {
        done = function() {};
      }
      player = 0;
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
              top: "-=10"
            }, SPEED_BASE);
          }).mouseout(function() {
            return $(this).animate({
              top: "+=10"
            }, SPEED_BASE);
          }).mousedown(function() {
            return finish(card);
          });
        }, this)(card));
      }
      return _results;
    };
    PlayingField.prototype.chooseFilteredCard = function(filter, done) {
      var card, finish, player, _i, _len, _ref, _results;
      if (done == null) {
        done = function() {};
      }
      player = 0;
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
                top: "-=10"
              }, SPEED_BASE);
            }).mouseout(function() {
              return $(this).animate({
                top: "+=10"
              }, SPEED_BASE);
            }).mousedown(function() {
              return finish(card);
            });
          }
        }, this)(card));
      }
      return _results;
    };
    PlayingField.prototype.chooseMultipleCards = function(choose, done) {
      var card, finished, getHandlers, handlers, multiple, player, _i, _len, _ref;
      if (done == null) {
        done = function() {};
      }
      player = 0;
      this.chosen = [];
      multiple = this.elem.find(".choose_multiple");
      multiple.find(".choose_count").html(choose);
      multiple.fadeIn(500);
      finished = __bind(function() {
        var card, _i, _len, _ref;
        multiple.fadeOut(500);
        _ref = this.hands[player];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          card.elem.removeClass("canChoose").unbind();
        }
        return done(this.chosen);
      }, this);
      getHandlers = __bind(function(card) {
        var deraise, raise, raised;
        raised = false;
        raise = function() {
          if (!raised) {
            raised = true;
            return card.elem.animate({
              top: "-=10"
            }, SPEED_BASE);
          }
        };
        deraise = function() {
          if (raised) {
            raised = false;
            return card.elem.animate({
              top: "+=10"
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
              return multiple.find("button").removeAttr("disabled").unbind().click(finished);
            } else {
              return multiple.find("button").attr("disabled", "");
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
        handlers = getHandlers(card);
        card.elem.addClass("canChoose").mouseover(handlers.onMouseOver).mousedown(handlers.onMouseDown).mouseout(handlers.onMouseOut);
      }
      return null;
    };
    PlayingField.prototype.choosePromise = function(minNoGiru, minOthers, canDealMiss, defaultSuit, defaultValue, callback) {
      var finish, getSuit, minValue, selectedSuit, selectedValue, setSuit, setValue, showSuit, showValue;
      if (defaultSuit == null) {
        defaultSuit = " ";
      }
      if (defaultValue == null) {
        defaultValue = 0;
      }
      if (callback == null) {
        callback = function(res) {};
      }
      selectedSuit = defaultSuit;
      selectedValue = defaultValue;
      minValue = 13;
      showSuit = function(suit) {
        console.log("showSuit " + suit + " " + SUIT_NAMES[suit]);
        return $("#selected_suit").html(SUIT_NAMES[suit]);
      };
      setSuit = function(suit) {
        selectedSuit = suit;
        minValue = selectedSuit === "n" ? minNoGiru : minOthers;
        return showSuit(suit);
      };
      showValue = function(val) {
        return $("#selected_value").html(val === 0 ? "" : val);
      };
      setValue = function(val) {
        selectedValue = val;
        showValue(val);
        if (minValue < selectedValue) {
          $("#minus_promise_button").removeAttr("disabled");
        } else {
          $("#minus_promise_button").attr("disabled", "");
        }
        if (selectedValue < 20) {
          $("#plus_promise_button").removeAttr("disabled");
        } else {
          $("#plus_promise_button").attr("disabled", "");
        }
        return $("#choose_promise_dialog .confirm").removeAttr("disabled");
      };
      getSuit = function(button) {
        return $(button).attr("id");
      };
      finish = function(res) {
        $("#choose_promise_dialog").hide();
        return callback(res);
      };
      $("#plus_promise_button").unbind("click").click(function() {
        return setValue(Math.min(20, selectedValue + 1));
      });
      $("#minus_promise_button").unbind("click").click(function() {
        return setValue(Math.max(minValue, selectedValue - 1));
      });
      $("#suit_select_buttons button").unbind("mouseover").unbind("mouseout").unbind("click").mouseover(function() {
        return showSuit(getSuit(this));
      }).mouseout(function() {
        return showSuit(selectedSuit);
      }).click(function() {
        $("#suit_select_buttons button.selected").removeClass("selected");
        $(this).addClass("selected");
        setSuit(getSuit(this));
        return setValue(minValue);
      });
      $("#promise_confirm_button").unbind("click").click(function() {
        return finish({
          "result": "confirm",
          "suit": selectedSuit,
          "value": selectedValue
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
      $("#value_select_buttons button").attr("disabled", "");
      $("#choose_promise_dialog .confirm").attr("disabled", "");
      if (canDealMiss) {
        $("#promise_dealmiss_button").show();
      } else {
        $("#promise_dealmiss_button").hide();
      }
      console.log("showSuit..", selectedSuit);
      setSuit(selectedSuit);
      setValue(selectedValue);
      $("#suit_select_buttons button").removeClass("selected");
      return $("#choose_promise_dialog").fadeIn(100);
    };
    return PlayingField;
  })();
  field = null;
  TEST_CARDS = [["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3", "s4", "c3"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]];
  $(document).ready(function() {
    var GAP;
    window.field = new PlayingField($("#playing_field"));
    $("button.choose_promise").click(function() {
      return window.field.choosePromise(13, 14, true, " ", 0, function(res) {
        return console.log(res);
      });
    });
    $("button.choose_promise_previous").click(function() {
      return window.field.choosePromise(17, 17, true, "h", 17, function(res) {
        return console.log(res);
      });
    });
    if (window.LIBGAME != null) {
      return;
    }
    window.field.setPlayers([
      {
        name: "JongMan Koo",
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
    SPEED_BASE = 50;
    GAP = SPEED_BASE * 20;
    return window.field.deal(TEST_CARDS, 1, function() {
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
          return window.field.chooseMultipleCards(3, function(chosen) {
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
