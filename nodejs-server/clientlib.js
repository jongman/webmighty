(function() {
  var FACE_ORDER, NetworkUser, SUIT_NAMES, VALUE_NAMES, VALUE_ORDER, a, allowGuestPlay, assertEqual, assertTrue, audiochannels, buildCommitmentString, buildMinimizedCardHtml, channel_max, checkForCommitment, client2index, commitmentIndex, doCommitment, friendHandler, getClassForChatUser, getIndexFromRelativeIndex, getLocalizedString, getRelativeIndexFromIndex, isJugong, jugongIndex, lang, lastSuit, loctable, myIndex, name2index, onAllReady, playSound, readyCount, renderFaceName, setFriendTitle, systemMsg, test, users;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  window.LIBGAME = 1;
  allowGuestPlay = false;
  assertTrue = function(o, msg) {
    var testFailFlag;
    if (msg == null) {
      msg = "";
    }
    if (!o) {
      alert("AssertTrue fail: " + msg);
      return testFailFlag = true;
    }
  };
  assertEqual = function(e, a, msg) {
    var testFailFlag;
    if (msg == null) {
      msg = "";
    }
    if (e !== a) {
      alert("AssertEqual fail: expected " + e + ", actual " + a + "; " + msg);
      return testFailFlag = true;
    }
  };
  test = function() {
    return assertTrue(rule.hasFace(['c3', 'jr'], 'c'));
  };
  test();
  systemMsg = function(msg) {
    return $('#log').html(function(index, oldHtml) {
      return oldHtml + '<BR>' + msg;
    });
  };
  VALUE_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "잭", "퀸", "킹", "에이스"];
  SUIT_NAMES = {
    s: "스페이드",
    h: "하트",
    c: "클로버",
    d: "다이아몬드",
    n: "노기루다"
  };
  name2index = {};
  client2index = {};
  myIndex = 0;
  users = {};
  jugongIndex = -1;
  FACE_ORDER = function(giruda_) {
    if (giruda_ == null) {
      giruda_ = null;
    }
    if (rule.currentPromise != null) {
      if (giruda_ == null) {
        giruda_ = rule.currentPromise[0];
      }
    }
    if (giruda_ == null) {
      giruda_ = 'n';
    }
    if (giruda_ === 's') {
      return "jsdch";
    }
    if (giruda_ === 'd') {
      return "jdsch";
    }
    if (giruda_ === 'c') {
      return "jcsdh";
    }
    if (giruda_ === 'h') {
      return "jhsdc";
    }
    return "jsdch";
  };
  VALUE_ORDER = "23456789tjqk1";
  buildMinimizedCardHtml = function(face) {
    return '<span class="smallcard ' + face + '"></span>';
  };
  getRelativeIndexFromIndex = function(idx) {
    return (idx - myIndex + 5) % 5;
  };
  getIndexFromRelativeIndex = function(ridx) {
    return (myIndex + ridx) % 5;
  };
  isJugong = function(index) {
    if (index == null) {
      index = null;
    }
    if (now.observer && !(index != null)) {
      return false;
    }
    if (index == null) {
      index = myIndex;
    }
    return index === jugongIndex;
  };
  channel_max = 10;
  audiochannels = [];
  for (a = 0; 0 <= channel_max ? a < channel_max : a > channel_max; 0 <= channel_max ? a++ : a--) {
    if ($.browser.msie) {
      continue;
    }
    audiochannels[a] = [];
    audiochannels[a]['channel'] = new Audio();
    audiochannels[a]['finished'] = -1;
  }
  playSound = function(soundName) {
    var a, elem, thistime, _results;
    if ($.browser.msie) {
      return;
    }
    thistime = new Date();
    elem = $("#sounds ." + soundName).get(0);
    if (elem.muted) {
      return;
    }
    _results = [];
    for (a = 0; 0 <= channel_max ? a < channel_max : a > channel_max; 0 <= channel_max ? a++ : a--) {
      if (audiochannels[a]['finished'] < thistime.getTime()) {
        audiochannels[a]['finished'] = thistime.getTime() + elem.duration * 1000;
        audiochannels[a]['channel'].src = elem.src;
        audiochannels[a]['channel'].load();
        audiochannels[a]['channel'].play();
        break;
      }
    }
    return _results;
  };
  lastSuit = null;
  doCommitment = function() {
    var canDealMiss, card, currentScore, defaultSuit, defaultValue, minNoGiru, minOthers, score, scores, _i, _len, _ref, _ref2, _ref3, _ref4;
    systemMsg("공약 내세우기");
    if (rule.currentPromise != null) {
      minNoGiru = minOthers = rule.currentPromise[1] + 1;
    } else {
      minNoGiru = rule.minVoteNoGiru;
      minOthers = rule.minVoteOthers;
    }
    canDealMiss = rule.checkDealMiss((function() {
      var _i, _len, _ref, _results;
      _ref = window.field.hands[0];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        _results.push(card.face);
      }
      return _results;
    })());
    if (lastSuit != null) {
      defaultSuit = lastSuit;
    } else {
      scores = {
        h: 0,
        s: 0,
        d: 0,
        c: 0
      };
      _ref = window.field.hands[0];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        if (card.face[0] === 'j') {
          continue;
        }
        score = 0;
        if (_ref2 = card.face[1], __indexOf.call('23456789', _ref2) >= 0) {
          score = 1;
        } else if (_ref3 = card.face[1], __indexOf.call('tjq', _ref3) >= 0) {
          score = 1.5;
        } else if (_ref4 = card.face[1], __indexOf.call('k1', _ref4) >= 0) {
          score = 2;
        }
        scores[card.face[0]] += score;
      }
      currentScore = scores.h;
      defaultSuit = 'h';
      if (scores.c > currentScore) {
        defaultSuit = 'c';
        currentScore = scores.c;
      }
      if (scores.d > currentScore) {
        defaultSuit = 'd';
        currentScore = scores.d;
      }
      if (scores.s > currentScore) {
        defaultSuit = 's';
        currentScore = scores.s;
      }
    }
    defaultValue = minOthers;
    return window.field.choosePromise(minNoGiru, minOthers, canDealMiss, defaultSuit, defaultValue, function(res) {
      console.log(res);
      if (res.result === "pass") {
        return now.commitmentPass();
      } else if (res.result === "dealmiss") {
        return now.commitmentDealMiss();
      } else {
        now.commitmentAnnounce(res.suit, res.value);
        return lastSuit = res.suit;
      }
    });
  };
  commitmentIndex = 0;
  checkForCommitment = function(idx) {
    commitmentIndex |= idx;
    if (commitmentIndex === 3) {
      return setTimeout(function() {
        return doCommitment();
      }, 300);
    }
  };
  now.requestCommitment = function() {
    checkForCommitment(2);
    now.notifyImTakingAction();
    return playSound("myturn");
  };
  now.notifyCards = function(allCards) {
    var cards;
    cards = [allCards.slice(0, 10), allCards.slice(10, 20), allCards.slice(20, 30), allCards.slice(30, 40), allCards.slice(40, 50)];
    window.field.globalMessage("선거가 시작됩니다!");
    return window.field.deal(cards, 1, function() {});
  };
  now.receiveDealtCards = function(cards) {
    var CARDS;
    lastSuit = null;
    window.field.clearPlayerMessages();
    commitmentIndex = 0;
    CARDS = [cards, ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]];
    window.field.globalMessage("선거가 시작됩니다!");
    return window.field.deal(CARDS, 1, function() {
      return checkForCommitment(1);
    });
  };
  now.requestRearrangeHand = function(additionalCards) {
    now.notifyImTakingAction();
    window.field.setSortOrder(FACE_ORDER());
    window.field.sortHands(0);
    return window.field.dealAdditionalCards(additionalCards, 0, function() {
      window.field.globalMessage("교체할 3장의 카드를 골라주세요.");
      return window.field.chooseMultipleCards(3, rule.currentPromise[0], rule.currentPromise[1], rule.getChangePromiseMinTargetTable(rule.currentPromise[0], rule.currentPromise[1]), function(chosen, newFace, newTarget) {
        var card;
        now.rearrangeHand((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = chosen.length; _i < _len; _i++) {
            card = chosen[_i];
            _results.push(card.face);
          }
          return _results;
        })(), newFace, newTarget);
        return window.field.takeCards(0, chosen, function() {
          var card, _i, _len;
          for (_i = 0, _len = chosen.length; _i < _len; _i++) {
            card = chosen[_i];
            window.field.hands[0].remove(card);
          }
          window.field.repositionCards(0);
          return assertEqual(10, window.field.hands[0].length);
        });
      });
    });
  };
  now.notifyRearrangeHandDone = function(cards) {
    var c, chosen, jugongRIndex, _i, _len, _ref, _ref2;
    if (cards == null) {
      cards = null;
    }
    if (isJugong()) {
      return;
    }
    jugongRIndex = getRelativeIndexFromIndex(jugongIndex);
    chosen = window.field.hands[jugongRIndex];
    chosen = [chosen[0], chosen[1], chosen[2]];
    if (cards != null) {
      chosen = [];
      _ref = window.field.hands[jugongRIndex];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        if (_ref2 = c.face, __indexOf.call(cards, _ref2) >= 0) {
          chosen.push(c);
        }
      }
    }
    return window.field.takeCards(jugongRIndex, chosen, function() {
      var card, _j, _len2;
      for (_j = 0, _len2 = chosen.length; _j < _len2; _j++) {
        card = chosen[_j];
        window.field.hands[jugongRIndex].remove(card);
      }
      return window.field.repositionCards(jugongRIndex);
    });
  };
  now.notifyRearrangeHand = function(cards) {
    if (cards == null) {
      cards = ['back', 'back', 'back'];
    }
    if (isJugong()) {
      return;
    }
    return window.field.dealAdditionalCards(cards, getRelativeIndexFromIndex(jugongIndex, function() {
      return window.field.globalMessage("" + users[jugongIndex].name + " 님이 당을 재정비하고 있습니다.");
    }));
  };
  now.requestChooseFriend = function() {
    return window.field.prompt('프렌드 선택 (예: nofriend firsttrick joker mighty ca d10 hk s3)', null, function(x) {
      var _ref, _ref2, _ref3;
      if (x === 'nofriend') {
        return now.chooseFriendNone();
      } else if (x === 'joker') {
        return now.chooseFriendByCard('jr');
      } else if (x === 'mighty') {
        return now.chooseFriendByCard(rule.getMightyCard());
      } else if (x === 'firsttrick') {
        return now.chooseFriendFirstTrick();
      } else if ((_ref = x[0], __indexOf.call('hcsd', _ref) >= 0) && x.length === 2 && (_ref2 = x[1], __indexOf.call('123456789tjkqa', _ref2) >= 0)) {
        if (x[1] === 'a') {
          x = x[0] + '1';
        }
        return now.chooseFriendByCard(x);
      } else if ((_ref3 = x[0], __indexOf.call('hcsd', _ref3) >= 0) && x.length === 3 && x[1] === '1' && x[2] === '0') {
        return now.chooseFriendByCard(x[0] + 't');
      } else {
        return now.requestChooseFriend();
      }
    });
  };
  now.notifyChooseFriend = function() {
    if (!isJugong()) {
      return window.field.globalMessage("" + users[jugongIndex].name + " 님이 함께할 프렌드를 선택하고 있습니다.");
    }
  };
  renderFaceName = function(face) {
    var suit, value;
    if (face === rule.getMightyCard()) {
      return "마이티";
    }
    if (face === 'jr') {
      return "조커";
    }
    suit = SUIT_NAMES[face[0]];
    if (face[0] === rule.currentPromise[0]) {
      suit = "기루다";
    }
    value = VALUE_NAMES[VALUE_ORDER.indexOf(face[1])];
    return "" + suit + " " + value;
  };
  friendHandler = function(index) {
    if (index === jugongIndex) {
      return;
    }
    window.field.setPlayerType(getRelativeIndexFromIndex(index), "프렌드");
    window.field.removeCollectedCards(getRelativeIndexFromIndex(index));
    return systemMsg("friend is " + users[index].name);
  };
  rule.setFriendHandler(friendHandler);
  setFriendTitle = function() {
    var cardName;
    if (rule.friendOption === rule.FriendOption.ByCard) {
      cardName = renderFaceName(rule.friendCard);
      return window.field.setStatusBar(function(card) {
        return ["주공 " + users[jugongIndex].name + " 공약 " + (card(rule.currentPromise[0], rule.currentPromise[1])) + " " + cardName + " 프렌드 =" + (card(rule.friendCard)), "마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
      });
    } else if (rule.friendOption === rule.FriendOption.NoFriend) {
      return window.field.setStatusBar(function(card) {
        return ["주공 " + users[jugongIndex].name + " 공약 " + (card(rule.currentPromise[0], rule.currentPromise[1])) + " 프렌드 없음", "마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
      });
    } else if (rule.friendOption === rule.FriendOption.FirstTrick) {
      return window.field.setStatusBar(function(card) {
        return ["주공 " + users[jugongIndex].name + " 공약 " + (card(rule.currentPromise[0], rule.currentPromise[1])) + " 초구 프렌드", "마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
      });
    } else {
      return window.field.setStatusBar(function(card) {
        return ["주공 " + users[jugongIndex].name + " 공약 " + (card(rule.currentPromise[0], rule.currentPromise[1])), "마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
      });
    }
  };
  now.notifyFriendByCard = function(card) {
    var c, cardName;
    cardName = renderFaceName(card);
    rule.setFriend(rule.FriendOption.ByCard, card);
    setFriendTitle();
    if ((rule.isFriendByHand((function() {
      var _i, _len, _ref, _results;
      _ref = window.field.hands[0];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        _results.push(c.face);
      }
      return _results;
    })())) && !isJugong()) {
      return window.field.setPlayerType(0, "(프렌드)");
    }
  };
  now.notifyFriendNone = function() {
    rule.setFriend(rule.FriendOption.NoFriend);
    return setFriendTitle();
  };
  now.notifyFriendFirstTrick = function() {
    rule.setFriend(rule.FriendOption.FirstTrick);
    return setFriendTitle();
  };
  now.requestChooseCard = function(currentTurn, option, fromServer) {
    var c, filter, handFace, player;
    if (fromServer == null) {
      fromServer = true;
    }
    if (fromServer) {
      now.notifyImTakingAction();
      playSound("myturn");
    }
    player = 0;
    handFace = (function() {
      var _i, _len, _ref, _results;
      _ref = window.field.hands[player];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        _results.push(c.face);
      }
      return _results;
    })();
    filter = function(card) {
      if (card.face === 'jr') {
        return true;
      }
      return rule.isValidChoice(handFace, card.face, option, currentTurn);
    };
    return window.field.chooseFilteredCard(filter, function(card) {
      var dontDo;
      dontDo = false;
      if (rule.currentTrick.length === 0) {
        if (card.face === 'jr') {
          if (currentTurn !== 0 && currentTurn !== 9) {
            window.field.chooseSuit(rule.currentPromise[0], function(suit) {
              if (!(suit != null)) {
                now.requestChooseCard(currentTurn, option, false);
                return;
              }
              option = rule.ChooseCardOption.None;
              if (suit[0] === 's') {
                option = rule.ChooseCardOption.SCome;
              } else if (suit[0] === 'd') {
                option = rule.ChooseCardOption.DCome;
              } else if (suit[0] === 'c') {
                option = rule.ChooseCardOption.CCome;
              } else if (suit[0] === 'h') {
                option = rule.ChooseCardOption.HCome;
              }
              return now.chooseCard(card.face, option);
            });
            dontDo = true;
          } else if (currentTurn === 0) {
            window.field.confirmYesNo("첫 턴에 조커는 아무런 효력이 없습니다.<BR/>그래도 내시겠습니까?", "그래도 냅니다.", "몰랐음. 안내요.", function(answer) {
              if (answer) {
                return now.chooseCard(card.face, option);
              } else {
                return now.requestChooseCard(currentTurn, option, false);
              }
            });
            dontDo = true;
          }
        } else if (card.face === rule.getJokerCallCard()) {
          dontDo = true;
          if (currentTurn === 0) {
            window.field.confirmYesNo("첫 턴에는 조커콜을 할 수 없습니다.<BR/>그냥 내시겠습니까?", "낼께요.", "다른 카드를 고르겠습니다.", function(answer) {
              if (answer) {
                return now.chooseCard(card.face, option);
              } else {
                return now.requestChooseCard(currentTurn, option, false);
              }
            });
          } else {
            window.field.confirmYesNo("조커콜 하나요?", "당연히!", "이번은 참아요.", function(doJokerCall) {
              if (doJokerCall) {
                option = rule.ChooseCardOption.JokerCall;
              } else {
                option = rule.ChooseCardOption.None;
              }
              return now.chooseCard(card.face, option);
            });
          }
        }
      } else {
        if (currentTurn === 0 && card.face === 'jr') {
          dontDo = true;
          window.field.confirmYesNo("첫 턴에 조커는 아무런 효력이 없습니다.<BR/>그래도 내시겠습니까?", "그래도 냅니다.", "몰랐음. 안내요.", function(answer) {
            if (answer) {
              return now.chooseCard(card.face, option);
            } else {
              return now.requestChooseCard(currentTurn, option, false);
            }
          });
        }
      }
      if (!dontDo) {
        return now.chooseCard(card.face, option);
      }
    });
  };
  now.notifyPlayCard = function(index, card, option) {
    var optionStr;
    optionStr = null;
    if (rule.currentTrick.length === 0) {
      if (option === rule.ChooseCardOption.JokerCall) {
        playSound("jokercall");
        optionStr = "조커 콜!";
      } else if (option === rule.ChooseCardOption.HCome || option === rule.ChooseCardOption.SCome || option === rule.ChooseCardOption.DCome || option === rule.ChooseCardOption.CCome) {
        playSound("playjoker");
        optionStr = "기루다 컴!";
        if (option === rule.ChooseCardOption.HCome && rule.currentPromise[0] !== 'h') {
          optionStr = "하트 컴!";
        } else if (option === rule.ChooseCardOption.DCome && rule.currentPromise[0] !== 'd') {
          optionStr = "다이아몬드 컴!";
        } else if (option === rule.ChooseCardOption.SCome && rule.currentPromise[0] !== 's') {
          optionStr = "스페이드 컴!";
        } else if (option === rule.ChooseCardOption.CCome && rule.currentPromise[0] !== 'c') {
          optionStr = "클로버 컴!";
        }
      }
    }
    if (!(optionStr != null)) {
      optionStr = renderFaceName(card);
      if (rule.currentTrick.length !== 0 && card[0] === rule.currentPromise[0] && (rule.currentTurn === 0 || rule.currentTurn === 9 || (option === rule.ChooseCardOption.None || option === rule.ChooseCardOption.JokerCall)) && rule.getCurrentTrickFace(option) !== card[0] && rule.currentTrick[0] !== rule.getMightyCard()) {
        playSound("gan");
      } else {
        playSound("playcard");
      }
    }
    window.field.playCard(getRelativeIndexFromIndex(index), card, optionStr);
    return rule.addTrick(card, index);
  };
  now.takeTrick = function(currentTurn, winnerIndex) {
    window.field.endTurn(getRelativeIndexFromIndex(winnerIndex), !(isJugong(winnerIndex) || rule.isFriend(winnerIndex) && rule.isFriendKnown()));
    rule.resetTrick(winnerIndex);
    return window.field.clearPlayerMessages();
  };
  NetworkUser = (function() {
    function NetworkUser(name, index, image) {
      this.name = name;
      this.index = index;
      this.image = image;
      name2index[this.name] = this.index;
    }
    return NetworkUser;
  })();
  buildCommitmentString = function(face, target) {
    var suit;
    suit = SUIT_NAMES[face];
    return "" + suit + " " + target;
  };
  now.notifyJugong = function(finalJugongIndex, face, target) {
    var name, newPromise;
    jugongIndex = finalJugongIndex;
    systemMsg("jugong is " + users[jugongIndex].name);
    rule.setPromise([face, target]);
    window.field.setSortOrder(FACE_ORDER());
    window.field.sortHands(0);
    if (now.state === now.VOTE) {
      window.field.setPlayerType(getRelativeIndexFromIndex(jugongIndex), "주공");
      window.field.playerMessage(getRelativeIndexFromIndex(jugongIndex), "당선", buildCommitmentString(face, target));
      if (isJugong()) {
        window.field.globalMessage("당선 축하드립니다!");
      } else {
        name = users[jugongIndex].name;
        window.field.globalMessage("" + name + " 님이 당선되었습니다!");
      }
      return window.field.setStatusBar(function(card) {
        return ["" + users[jugongIndex].name + " 당선! 공약 " + (card(face, target)), "마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
      });
    } else if (now.state === now.REARRANGE_HAND) {
      newPromise = buildCommitmentString(face, target);
      window.field.globalMessage("공약이 변경되었습니다: " + newPromise);
      return window.field.setStatusBar(function(card) {
        return ["공약 변경 " + (card(face, target)), "마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
      });
    }
  };
  now.resetRule = function() {
    return rule.resetGame();
  };
  now.notifyChangeState = function(newState) {
    var ridx;
    systemMsg('changeState to ' + newState);
    if (newState !== now.WAITING_PLAYER) {
      window.field.hidePlayerList();
    }
    if (newState === now.WAITING_PLAYER) {
      window.field.setPlayers([]);
      window.field.showPlayerList();
      window.field.setStatusBar(function(card) {
        return ["웹마이티에 오신 것을 환영합니다!", "마이티 " + (card("s1")) + " 조커콜 " + (card("c3"))];
      });
    }
    if (newState === now.VOTE) {
      window.field.setStatusBar(function(card) {
        return ["새 게임을 시작합니다.", "마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
      });
      commitmentIndex = 0;
      rule.resetGame();
      window.field.setSortOrder(FACE_ORDER());
      return window.field.setPlayers((function() {
        var _results;
        _results = [];
        for (ridx = 0; ridx < 5; ridx++) {
          _results.push({
            name: users[getIndexFromRelativeIndex(ridx)].name,
            picture: (users[getIndexFromRelativeIndex(ridx)].image === "" ? "static/guest.png" : users[getIndexFromRelativeIndex(ridx)].image)
          });
        }
        return _results;
      })());
    }
  };
  now.notifyPlayers = function(infos) {
    var i, image, index, name;
    console.log("notifyPlayers");
    users = {};
    window.field.clearPlayerList();
    for (i = 0; i < 5; i++) {
      if (i >= infos.length) {
        break;
      }
      name = infos[i][0];
      image = "";
      image = infos[i][1];
      index = i;
      if (name !== "") {
        users[index] = new NetworkUser(name, index, image);
        window.field.addPlayerToList(index, name, image);
      } else {
        window.field.removePlayerFromList(index);
      }
    }
    if (now.state === now.WAITING_PLAYER) {
      return window.field.showPlayerList();
    }
  };
  now.notifyMsg = function(msg) {
    if (window.field != null) {
      return window.field.globalMessage(msg);
    }
  };
  now.notifyVote = function(index, face, target) {
    rule.setPromise([face, target]);
    window.field.setStatusBar(function(card) {
      return ["유력후보: " + users[index].name + " 공약 " + (card(face, target)), "당선 시 마이티 " + (card(rule.getMightyCard())) + " 조커콜 " + (card(rule.getJokerCallCard()))];
    });
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "공약", buildCommitmentString(face, target));
  };
  now.notifyDealMiss = function(index, hand) {
    window.field.clearPlayerMessages();
    window.field.playerMessage(getRelativeIndexFromIndex(index), "딜미스!");
    window.field.showDealMissHand(hand, users[index].name);
    return window.field.setStatusBar(function(card) {
      return ["딜미스!", ""];
    });
  };
  now.notifyPass = function(index) {
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "패스");
  };
  now.notifyVictory = function(victoryFlag) {
    var isIAmOnRuler, isMyWin, isMywin;
    isIAmOnRuler = isJugong() || rule.isFriend(myIndex);
    isMyWin = null;
    if (victoryFlag === rule.Victory.LoseByBackRun || victoryFlag === rule.Victory.Lose) {
      isMywin = !isIAmOnRuler;
    } else {
      isMywin = isIAmOnRuler;
    }
    if (isMywin) {
      playSound("win");
      if (victoryFlag === rule.Victory.LoseByBackRun || victoryFlag === rule.Victory.WinByRun || victoryFlag === rule.Victory.WinByNoticedRun) {
        return playSound("clap");
      }
    } else {
      return playSound("lose");
    }
  };
  now.notifyReady = function(clientId, index, playerInfos) {
    if (clientId === now.core.clientId) {
      myIndex = index;
    }
    systemMsg("players: " + playerInfos);
    window.field.addPlayerToList(index, playerInfos[index][0], playerInfos[index][1]);
    return window.field.showPlayerList();
  };
  now.notifyObserver = function(encodedRule, cards, collectedCards, currentTrickStartIndex, jugongIndex_) {
    var card, hand, i, ridx, _ref, _ref2;
    console.log('notifyObserver');
    console.log(cards);
    myIndex = 0;
    now.resetField();
    jugongIndex = jugongIndex_;
    window.field.setPlayers((function() {
      var _results;
      _results = [];
      for (ridx = 0; ridx < 5; ridx++) {
        _results.push({
          name: users[getIndexFromRelativeIndex(ridx)].name,
          picture: (users[getIndexFromRelativeIndex(ridx)].image === "" ? "static/guest.png" : users[getIndexFromRelativeIndex(ridx)].image)
        });
      }
      return _results;
    })());
    window.field.collected = [[], [], [], [], []];
    rule.decodeState(encodedRule);
    window.field.playedCards = window.field.createCardsFromFace(rule.currentTrick);
    if ((jugongIndex != null) && ((_ref = now.state) === now.VOTE_KILL || _ref === now.REARRANGE_HAND || _ref === now.CHOOSE_FRIEND || _ref === now.TAKE_TURN)) {
      window.field.setPlayerType(getRelativeIndexFromIndex(jugongIndex), "주공");
    }
    if (now.state === now.TAKE_TURN) {
      if (rule.isFriendKnown()) {
        window.field.setPlayerType(getRelativeIndexFromIndex(rule.friendIndex), "프렌드");
      }
    }
    for (i = 0, _ref2 = window.field.playedCards.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
      card = window.field.playedCards[i];
      window.field.moveToPlayedPosition((i + currentTrickStartIndex) % 5, card);
    }
    window.field.hands = [];
    window.field.setSortOrder(FACE_ORDER());
    for (i = 0; i < 5; i++) {
      hand = window.field.createCardsFromFace(cards[i], i);
      window.field.hands.push(hand);
      if (isJugong(i) || rule.isFriend(i)) {} else {
        window.field.collectCards(i, window.field.createCardsFromFace(collectedCards[i], i));
      }
      window.field.repositionCards(i);
      window.field.sortHands(i);
    }
    if (now.state !== now.VOTE && now.state !== now.WAITING_PLAYER) {
      return setFriendTitle();
    }
  };
  now.resetField = function() {
    window.field.clearCards();
    window.field.clearDialogs();
    if (now.state === now.WAITING_PLAYER) {
      return window.field.showPlayerList();
    }
  };
  now.notifyStat = function() {
    var daily, total;
    daily = now.userStat.daily;
    total = now.userStat.total;
    now.distributeMessage("오늘 " + daily.jw + "/" + daily.jl + " " + daily.fw + "/" + daily.fl + " " + daily.yw + "/" + daily.yl);
    return now.distributeMessage("전체 " + total.jw + "/" + total.jl + " " + total.fw + "/" + total.fl + " " + total.yw + "/" + total.yl);
  };
  getClassForChatUser = function(clientId, index) {
    var c;
    c = "";
    if (clientId === now.core.clientId) {
      c = "me";
    }
    if (index >= 0 && index < 5) {
      if (c !== "") {
        c += " ";
      }
      c += "player";
    }
    if (index >= 0 && index < 5 && ((jugongIndex != null) && index === jugongIndex || (rule.friendIndex != null) && index === rule.friendIndex)) {
      if (c !== "") {
        c += " ";
      }
      c += "ruler";
    }
    return c;
  };
  now.notifyUserList = function(userList) {
    var d, name, _i, _len;
    d = "<ul>";
    for (_i = 0, _len = userList.length; _i < _len; _i++) {
      name = userList[_i];
      name = $("#chatbox .escaper").text(name).html();
      d += "<li>" + name + "</li>";
    }
    d += "</ul>";
    $("#chatbox .member_list").html(d);
    return $("#chatbox .toggle_member_list").text("(" + userList.length + ")");
  };
  now.receiveMessage = function(clientId, index, name, msg) {
    var c, daily, total;
    c = getClassForChatUser(clientId, index);
    if (c !== "") {
      name = "<span class=\"" + c + "\">" + name + "</span>";
    }
    if (clientId === now.core.clientId && msg[0] === "/") {
      if (msg.substr(1, msg.length) === "전적") {
        daily = now.userStat.daily;
        total = now.userStat.total;
        now.distributeMessage("오늘 " + daily.jw + "/" + daily.jl + " " + daily.fw + "/" + daily.fl + " " + daily.yw + "/" + daily.yl);
        now.distributeMessage("전체 " + total.jw + "/" + total.jl + " " + total.fw + "/" + total.fl + " " + total.yw + "/" + total.yl);
      }
    }
    return window.field.addChatMessage(name, msg);
  };
  now.notifyInAction = function(index) {
    return window.field.displayPlayerInAction(getRelativeIndexFromIndex(index));
  };
  now.showName = function() {
    return systemMsg("i am " + this.now.name);
  };
  readyCount = 0;
  onAllReady = function() {
    var fbHandler;
    now.fbUserID = null;
    window.field.setChatHandler(function(s) {
      if (now.name.substr(0, 6) === "player") {
        return window.field.prompt("What's your name?", now.name, function(n) {
          if (n === "") {
            return;
          }
          if (now.name !== n) {
            now.name = n;
            now.notifyChangeName();
          }
          return now.distributeMessage(s);
        });
      } else {
        return now.distributeMessage(s);
      }
    });
    window.field.setStatusBar(function(card) {
      return ["웹마이티에 오신 것을 환영합니다!", "마이티 " + (card("s1")) + " 조커콜 " + (card("c3"))];
    });
    fbHandler = function(response) {
      $("#oneliner").text("");
      if (response.status === "connected" && (response.authResponse != null)) {
        now.fbAccessToken = window.fbAccessToken = response.authResponse.accessToken;
        now.image = "http://graph.facebook.com/" + response.authResponse.userID + "/picture";
        return FB.api('/me', function(user) {
          if (user != null) {
            now.name = user.name;
            now.fbUserID = user.id;
            now.notifyChangeFBID(user.id);
            return now.notifyChangeName();
          }
        });
      } else {
        now.image = "";
        now.fbUserID = null;
        now.notifyChangeFBID(null);
        now.notifyChangeName();
        if (!allowGuestPlay) {
          return $("#oneliner").text("플레이하기 위해선 페이스북 로그인이 필요합니다.");
        }
      }
    };
    if (typeof FB !== "undefined" && FB !== null) {
      FB.getLoginStatus(fbHandler);
      FB.Event.subscribe("auth.authResponseChange", fbHandler);
      FB.Event.subscribe("auth.statusChange", fbHandler);
    }
    window.field.setPlayerListHandler(function() {
      if (now.name.substr(0, 6) === "player") {
        return window.field.prompt("What's your name?", now.name, function(n) {
          if (n === "") {
            return;
          }
          if (now.name !== n) {
            now.name = n;
            now.notifyChangeName();
          }
          return now.readyGame();
        });
      } else {
        return now.readyGame();
      }
    });
    if (now.state === now.WAITING_PLAYER) {
      window.field.showPlayerList();
    }
    return $("#logwin").find("button").click(function() {
      if (now.name.substr(0, 6) === "player") {
        return window.field.prompt("What's your name?", now.name, function(n) {
          if (n === "") {
            return;
          }
          if (now.name !== n) {
            now.name = n;
            now.notifyChangeName();
          }
          return now.readyGame();
        });
      } else {
        return now.readyGame();
      }
    });
  };
  $(document).ready(function() {
    $("button.toggle_player_list").unbind("click").click(function() {
      if ($("#player_list_dialog").css("display") === "none") {
        return $("#player_list_dialog").show();
      } else {
        return $("#player_list_dialog").hide();
      }
    });
    $("button.prompt").unbind("click").click(function() {
      return playSound("playcard");
    });
    readyCount += 1;
    if (readyCount === 2) {
      return onAllReady();
    }
  });
  now.ready(function() {
    readyCount += 1;
    if (readyCount === 2) {
      return onAllReady();
    }
  });
  now.setAllowGuestPlay = function(bool) {
    allowGuestPlay = bool;
    if (allowGuestPlay) {
      return $("#oneliner").text("");
    }
  };
  loctable = {
    en: {
      패스: 'Pass'
    }
  };
  lang = 'ko';
  getLocalizedString = function(lang, word) {
    if (lang === 'ko') {
      return word;
    }
    if (__indexOf.call(loctable, lang) >= 0 && __indexOf.call(loctable[lang], word) >= 0) {
      return loctable[lang][word];
    } else {
      console.log("not localizable word " + word + " for language " + lang);
      return word;
    }
  };
}).call(this);
