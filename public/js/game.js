var CARD_HEIGHT, CARD_OVERLAP, CARD_WIDTH, Card, DISAPPEAR_DIRECTION, PI, PLAYER_LOCATION, PROFILE_CARD_GAP, PROFILE_WIDTH, PlayingField, SPEED_BASE, TEST_CARDS, VALUE_ORDER, assert, field, floor, lexicographic_compare;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};
PROFILE_WIDTH = 250;
PROFILE_CARD_GAP = 15;
CARD_WIDTH = 71;
CARD_HEIGHT = 96;
CARD_OVERLAP = 20;
SPEED_BASE = 50;
PI = Math.PI;
PLAYER_LOCATION = {
  5: [
    {
      side: "bottom",
      location: 0.5,
      angle: PI * (3 / 4)
    }, {
      side: "left",
      location: 0.6,
      angle: PI * (3 / 4 - 1 / 5)
    }, {
      side: "top",
      location: 0.25,
      angle: PI * (3 / 4 - 2 / 5)
    }, {
      side: "top",
      location: 0.75,
      angle: PI * (3 / 4 - 3 / 5)
    }, {
      side: "right",
      location: 0.6,
      angle: PI * (3 / 4 - 4 / 5)
    }
  ]
};
DISAPPEAR_DIRECTION = {
  left: [-CARD_HEIGHT, 0],
  right: [CARD_HEIGHT, 0],
  top: [0, -CARD_HEIGHT],
  bottom: [0, CARD_HEIGHT]
};
VALUE_ORDER = "23456789tjqk1";
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
  }
  PlayingField.prototype.getCardDirection = function(player) {
    var side;
    side = PLAYER_LOCATION[this.players.length][player].side;
    if (side === "top" || side === "bottom") {
      return "vertical";
    } else {
      return "horizontal";
    }
  };
  PlayingField.prototype.getCardPosition = function(player, cards, index) {
    var cx, cy, dx, dy, fx, fy, location, side, totalWidth, _ref;
    _ref = PLAYER_LOCATION[this.players.length][player], side = _ref.side, location = _ref.location;
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
    _ref = PLAYER_LOCATION[this.players.length][player], side = _ref.side, location = _ref.location;
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
    var i, n, _ref;
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
    for (i = 0, _ref = n - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      this.hands[player][i].elem.css({
        "z-index": n - i
      });
    }
    return this.repositionCards(player);
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
      for (i = 0, _ref = this.players.length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
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
        for (index = 0, _ref = cards[0].length - 1; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
          _fn = __bind(function(card, face, player, index, dealt) {
            return setTimeout(__bind(function() {
              var pos;
              card.setFace(face);
              card.setDirection(this.getCardDirection(player));
              pos = this.getCardPosition(player, cards[0].length, index);
              card.moveTo(pos.x, pos.y, SPEED_BASE);
              return null;
            }, this), dealt * SPEED_BASE);
          }, this);
          for (pl = 0, _ref2 = this.players.length - 1; 0 <= _ref2 ? pl <= _ref2 : pl >= _ref2; 0 <= _ref2 ? pl++ : pl--) {
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
          for (i = 0, _ref3 = this.cardStack.length - 1; 0 <= _ref3 ? i <= _ref3 : i >= _ref3; 0 <= _ref3 ? i++ : i--) {
            this.cardStack[i].elem.animate({
              top: "-=" + (i * 2),
              left: "-=" + (i * 2)
            }, 50);
          }
          for (player = 0, _ref4 = this.players.length - 1; 0 <= _ref4 ? player <= _ref4 : player >= _ref4; 0 <= _ref4 ? player++ : player--) {
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
    for (i = 0, _ref = this.hands[player].length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      pos = this.getCardPosition(player, this.hands[player].length, i);
      _results.push(this.hands[player][i].moveTo(pos.x, pos.y, SPEED_BASE * 5));
    }
    return _results;
  };
  PlayingField.prototype.dealAdditionalCards = function(faces, player, done) {
    var card, idx, n, _fn, _ref;
    if (done == null) {
      done = function() {};
    }
    console.log(faces);
    n = faces.length;
    assert(n === this.cardStack.length);
    _fn = __bind(function(idx, card) {
      console.log(idx);
      return setTimeout(__bind(function() {
        card.setFace(faces[idx]);
        console.log("dealing", faces[idx], idx);
        card.setDirection(this.getCardDirection(player));
        this.hands[player].push(card);
        this.repositionCards(player);
        return null;
      }, this), idx * SPEED_BASE * 5);
    }, this);
    for (idx = 0, _ref = n - 1; 0 <= _ref ? idx <= _ref : idx >= _ref; 0 <= _ref ? idx++ : idx--) {
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
    var elem, i, side, x, y, _ref, _ref2, _results;
    this.players = players;
    _results = [];
    for (i = 0, _ref = this.players.length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      _ref2 = this.getProfilePosition(i), side = _ref2.side, y = _ref2.y, x = _ref2.x;
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
  PlayingField.prototype.takeCards = function(player, cards, done) {
    var cx, cy, dx, dy, home, i, _ref, _ref2;
    if (done == null) {
      done = function() {};
    }
    home = this.getCardPosition(player, 1, 0);
    _ref = DISAPPEAR_DIRECTION[PLAYER_LOCATION[this.players.length][player].side], dx = _ref[0], dy = _ref[1];
    cx = home.x + dx;
    cy = home.y + dy;
    for (i = 0, _ref2 = cards.length - 1; 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
      cards[i].elem.delay(i * SPEED_BASE).animate({
        top: cy,
        left: cx
      }, SPEED_BASE).fadeOut(0);
    }
    return setTimeout(__bind(function() {
      var card, _i, _len;
      for (_i = 0, _len = cards.length; _i < _len; _i++) {
        card = cards[_i];
        card.remove();
      }
      return done();
    }, this), cards.length * SPEED_BASE);
  };
  PlayingField.prototype.chooseMultipleCards = function(player, choose, done) {
    var card, finished, getHandlers, handlers, multiple, _i, _len, _ref;
    if (done == null) {
      done = function() {};
    }
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
        card.elem.removeClass("canChoose").unbind("mouseover").unbind("mousedown").unbind("mouseout");
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
          }, 40);
        }
      };
      deraise = function() {
        if (raised) {
          raised = false;
          return card.elem.animate({
            top: "+=10"
          }, 40);
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
            return multiple.find("button").removeAttr("disabled").click(finished);
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
  return PlayingField;
})();
field = null;
TEST_CARDS = [["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3", "s4", "c3"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]];
$(document).ready(function() {
  var GAP;
  window.field = new PlayingField($("#playing_field"));
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
  GAP = 100;
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
      return window.field.playerMessage(0, "당선", "스페이드 16");
    }, GAP * 7);
    return setTimeout(function() {
      /*
      				window.field.dealAdditionalCards(["back", "back", "back"], 1,
      				->
      					window.field.takeCards(1, (window.field.hands[1].pop() for i in [0..2]))
      				)
      				*/      return window.field.dealAdditionalCards(["sq", "jr", "hk"], 0, function() {
        window.field.globalMessage("버릴 3장의 카드를 골라주세요.");
        return window.field.chooseMultipleCards(0, 3, function(chosen) {
          return window.field.takeCards(0, chosen, function() {
            var card, _i, _len;
            for (_i = 0, _len = chosen.length; _i < _len; _i++) {
              card = chosen[_i];
              window.field.hands[0].remove(card);
            }
            return window.field.repositionCards(0);
          });
        });
      });
    }, GAP * 8);
  });
});