(function() {
  var FACE_ORDER, NetworkUser, SUIT_NAMES, VALUE_NAMES, VALUE_ORDER, assertEqual, assertTrue, buildCommitmentString, checkForCommitment, client2index, commitmentIndex, doCommitment, friendHandler, getIndexFromRelativeIndex, getLocalizedString, getRelativeIndexFromClientId, getRelativeIndexFromIndex, isFriend, isFriendKnown, isJugong, jugongIndex, lang, loctable, myIndex, name2index, readyCount, renderFaceName, systemMsg, test, users;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  window.LIBGAME = 1;
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
    giruda_ || (giruda_ = rule.currentPromise[0]);
    giruda_ || (giruda_ = 'n');
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
  getRelativeIndexFromClientId = function(clientId) {
    return (client2index[clientId] - myIndex + 5) % 5;
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
    index || (index = myIndex);
    return index === jugongIndex;
  };
  isFriend = function(index) {
    if (index == null) {
      index = null;
    }
    index || (index = myIndex);
    return false;
  };
  isFriendKnown = function(index) {
    if (index == null) {
      index = null;
    }
    index || (index = myIndex);
    return false;
  };
  doCommitment = function() {
    var count, x, _ref, _ref2, _results;
    systemMsg("공약 내세우기");
    _results = [];
    while (1) {
      x = prompt('공약 써주세요 (예: n14 s15 pass dealmiss)');
      if (x === 'pass') {
        now.commitmentPass();
      } else if (x === 'dealmiss') {
        now.commitmentDealMiss();
      } else if (((_ref = x[0]) === 'h' || _ref === 'c' || _ref === 'n' || _ref === 's' || _ref === 'd') && x.length <= 3 && ((_ref2 = x[1]) === '1' || _ref2 === '2')) {
        count = parseInt(x.substr(1));
        if (count >= 12 && count <= 20) {
          now.commitmentAnnounce(x[0], count);
        } else {
          continue;
        }
      } else {
        continue;
      }
      break;
    }
    return _results;
  };
  commitmentIndex = 0;
  checkForCommitment = function() {
    commitmentIndex += 1;
    if (commitmentIndex >= 2) {
      return setTimeout(function() {
        return doCommitment();
      }, 300);
    }
  };
  now.requestCommitment = function() {
    return checkForCommitment();
  };
  now.receiveDealtCards = function(cards) {
    var CARDS;
    commitmentIndex = 0;
    CARDS = [cards, ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]];
    window.field.globalMessage("선거가 시작됩니다!");
    return window.field.deal(CARDS, 1, function() {
      checkForCommitment();
      return systemMsg(window.field.cardStack);
    });
  };
  now.requestRearrangeHand = function(additionalCards) {
    systemMsg(additionalCards);
    systemMsg(window.field.cardStack);
    systemMsg(window.field.cardStack.length);
    return window.field.dealAdditionalCards(additionalCards, 0, function() {
      window.field.globalMessage("교체할 3장의 카드를 골라주세요.");
      return window.field.chooseMultipleCards(3, function(chosen) {
        var card;
        now.rearrangeHand((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = chosen.length; _i < _len; _i++) {
            card = chosen[_i];
            _results.push(card.face);
          }
          return _results;
        })(), rule.currentPromise[0], rule.currentPromise[1]);
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
  now.notifyRearrangeHandDone = function() {
    var chosen, jugongRIndex;
    if (isJugong()) {
      return;
    }
    console.log('notifyRearrangeHandDone');
    jugongRIndex = getRelativeIndexFromIndex(jugongIndex);
    chosen = window.field.hands[jugongRIndex];
    chosen = [chosen[0], chosen[1], chosen[2]];
    return window.field.takeCards(jugongRIndex, chosen, function() {
      var card, _i, _len;
      for (_i = 0, _len = chosen.length; _i < _len; _i++) {
        card = chosen[_i];
        window.field.hands[jugongRIndex].remove(card);
      }
      return window.field.repositionCards(jugongRIndex);
    });
  };
  now.notifyRearrangeHand = function() {
    if (isJugong()) {
      return;
    }
    systemMsg(window.field.cardStack);
    systemMsg(window.field.cardStack.length);
    return window.field.dealAdditionalCards(['back', 'back', 'back'], getRelativeIndexFromIndex(jugongIndex, function() {
      return window.field.globalMessage("" + users[jugongIndex].name + " 님이 당을 재정비하고 있습니다.");
    }));
  };
  now.requestChooseFriend = function() {
    var x, _ref, _ref2, _ref3, _results;
    systemMsg("프렌 선택");
    _results = [];
    while (1) {
      x = prompt('프렌드 선택 (예: nofriend firsttrick joker mighty ca d10 hk s3)');
      if (x === 'nofriend') {
        now.chooseFriendNone();
      } else if (x === 'joker') {
        now.chooseFriendByCard('jr');
      } else if (x === 'mighty') {
        now.chooseFriendByCard(rule.getMightyCard());
      } else if (x === 'firsttrick') {
        now.chooseFriendFirstTrick();
      } else if ((_ref = x[0], __indexOf.call('hcsd', _ref) >= 0) && x.length === 2 && (_ref2 = x[1], __indexOf.call('123456789tjkqa', _ref2) >= 0)) {
        if (x[1] === 'a') {
          x = x[0] + '1';
        }
        now.chooseFriendByCard(x);
      } else if ((_ref3 = x[0], __indexOf.call('hcsd', _ref3) >= 0) && x.length === 3 && x[1] === '1' && x[2] === '0') {
        now.chooseFriendByCard(x[0] + 't');
      } else {
        continue;
      }
      break;
    }
    return _results;
  };
  now.notifyChooseFriend = function() {
    if (isJugong()) {
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
    window.field.setPlayerType(getRelativeIndexFromIndex(index), "프렌드");
    window.field.removeCollectedCards(getRelativeIndexFromIndex(index));
    return systemMsg("friend is " + index);
  };
  rule.setFriendHandler(friendHandler);
  now.notifyFriendByCard = function(card) {
    var cardName;
    cardName = renderFaceName(card);
    document.title = buildCommitmentString.apply(null, rule.currentPromise) + ', ' + cardName + '프렌드';
    rule.setFriend(rule.FriendOption.ByCard, card);
    systemMsg("friend is " + card + ' ' + cardName);
    if (rule.isFriendByHand(window.field.hands[0] && !isJugong())) {
      return window.field.setPlayerType(0, "프렌드");
    }
  };
  now.notifyFriendNone = function() {
    document.title = buildCommitmentString.apply(null, rule.currentPromise) + ', ' + '프렌드 없음';
    rule.setFriend(rule.FriendOption.NoFriend);
    return systemMsg("no friend");
  };
  now.notifyFriendFirstTrick = function() {
    document.title = buildCommitmentString(face, target) + ', ' + '초구 프렌드';
    rule.setFriend(rule.FriendOption.FirstTrick);
    return systemMsg("first trick friend");
  };
  now.requestChooseCard = function(currentTurn, option) {
    var c, filter, handFace, player;
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
    systemMsg(rule.currentTrick);
    return window.field.chooseFilteredCard(filter, function(card) {
      var answer, doJokerCall, dontDo, suit;
      dontDo = false;
      if (rule.currentTrick.length === 0) {
        if (card.face === 'jr') {
          if (currentTurn !== 0 && currentTurn !== 9) {
            while (1) {
              suit = prompt("무늬를 선택해주세요(s/d/c/h/g:기루)");
              if (suit[0] === 's') {
                option = rule.ChooseCardOption.SCome;
              } else if (suit[0] === 'd') {
                option = rule.ChooseCardOption.DCome;
              } else if (suit[0] === 'c') {
                option = rule.ChooseCardOption.CCome;
              } else if (suit[0] === 'h') {
                option = rule.ChooseCardOption.HCome;
              } else {
                continue;
              }
              break;
            }
          } else if (currentTurn === 0) {
            answer = prompt("첫턴에 조커는 아무런 효력이 없습니다. 그래도 내시겠습니까? (yes / no)", "n");
            if (answer[0] === 'y') {} else {
              dontDo = true;
              now.requestChooseCard(currentTurn, option);
            }
          }
        } else if (card.face === rule.getJokerCallCard() && currentTurn !== 0) {
          doJokerCall = prompt("조커콜 하나요? (yes / no)");
          if (doJokerCall[0] === 'y') {
            option = rule.ChooseCardOption.JokerCall;
          }
        }
      } else {
        if (currentTurn === 0 && card.face === 'jr') {
          answer = prompt("첫턴에 조커는 아무런 효력이 없습니다. 그래도 내시겠습니까? (yes / no)", "n");
          if (answer[0] === 'y') {} else {
            dontDo = true;
            now.requestChooseCard(currentTurn, option);
          }
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
        optionStr = "조커 콜!";
      } else if (option === rule.ChooseCardOption.HCome || option === rule.ChooseCardOption.SCome || option === rule.ChooseCardOption.DCome || option === rule.ChooseCardOption.CCome) {
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
    }
    systemMsg("PlayCard " + index + " " + card + " " + optionStr);
    window.field.playCard(getRelativeIndexFromIndex(index), card, optionStr);
    return rule.addTrick(card, index);
  };
  now.takeTrick = function(currentTurn, winnerIndex) {
    window.field.endTurn(getRelativeIndexFromIndex(winnerIndex), !(isJugong(winnerIndex) || rule.isFriend(winnerIndex) && rule.isFriendKnown()));
    return rule.resetTrick(winnerIndex);
  };
  NetworkUser = (function() {
    function NetworkUser(clientId, name, index) {
      this.clientId = clientId;
      this.name = name;
      this.index = index;
      client2index[this.clientId] = this.index;
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
    document.title = buildCommitmentString(face, target);
    if (now.state === now.VOTE) {
      window.field.setPlayerType(getRelativeIndexFromIndex(jugongIndex), "주공");
      window.field.playerMessage(getRelativeIndexFromIndex(jugongIndex), "당선", buildCommitmentString(face, target));
      if (isJugong()) {
        return window.field.globalMessage("당선 축하드립니다!");
      } else {
        name = users[jugongIndex].name;
        return window.field.globalMessage("" + name + " 님이 당선되었습니다!");
      }
    } else if (now.state === now.REARRANGE_HAND) {
      newPromise = buildCommitmentString(face, target);
      return window.field.globalMessage("공약이 변경되었습니다: " + newPromise);
    }
  };
  now.notifyChangeState = function(newState) {
    var ridx;
    systemMsg('changeState to ' + newState);
    if (newState === now.VOTE) {
      document.title = "새 게임을 시작합니다.";
      commitmentIndex = 0;
      rule.resetGame();
      return window.field.setPlayers((function() {
        var _results;
        _results = [];
        for (ridx = 0; ridx < 5; ridx++) {
          _results.push({
            name: users[getIndexFromRelativeIndex(ridx)].name,
            picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/49218_593417379_9696_q.jpg"
          });
        }
        return _results;
      })());
    } else if (newState === now.END_GAME) {
      name2index = {};
      client2index = {};
      return users = {};
    }
  };
  now.notifyPlayers = function(clientIds, names) {
    var clientId, i, index, name, _results;
    _results = [];
    for (i = 0; i < 5; i++) {
      clientId = clientIds[i];
      name = names[i];
      index = i;
      _results.push(users[index] = new NetworkUser(clientId, name, index));
    }
    return _results;
  };
  now.notifyMsg = function(msg) {
    window.field.globalMessage(msg);
    return document.title = msg;
  };
  now.notifyVote = function(index, face, target) {
    rule.setPromise([face, target]);
    systemMsg(buildCommitmentString(face, target));
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "공약", buildCommitmentString(face, target));
  };
  now.notifyDealMiss = function(index) {
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "딜미스");
  };
  now.notifyPass = function(index) {
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "패스");
  };
  now.notifyVictory = function(victoryFlag) {};
  now.notifyReady = function(clientId, name, index) {
    systemMsg(name + " ready");
    name2index[name] = index;
    client2index[clientId] = index;
    users[index] = new NetworkUser(clientId, name, index);
    if (clientId === now.core.clientId) {
      return myIndex = index;
    }
  };
  now.showName = function() {
    return systemMsg("i am " + this.now.name);
  };
  readyCount = 0;
  $(document).ready(function() {
    readyCount += 1;
    if (readyCount === 2) {
      return now.readyGame();
    }
  });
  now.ready(function() {
    readyCount += 1;
    if (readyCount === 2) {
      return now.readyGame();
    }
  });
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
