(function() {
  var FACE_ORDER, NetworkUser, SUIT_NAMES, VALUE_NAMES, VALUE_ORDER, buildCommitmentString, checkForCommitment, client2index, commitmentIndex, currentPromise, doCommitment, getIndexFromRelativeIndex, getLocalizedString, getMightyCard, getRelativeIndexFromClientId, getRelativeIndexFromIndex, isFriend, isFriendKnown, isJugong, jugongIndex, lang, loctable, myIndex, name2index, renderFaceName, systemMsg, users;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  window.LIBGAME = 1;
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
  currentPromise = ['n', 0];
  getMightyCard = function() {
    if (currentPromise[0] === 's') {
      return 'd1';
    }
    return 's1';
  };
  FACE_ORDER = function(giruda_) {
    if (giruda_ == null) {
      giruda_ = null;
    }
    giruda_ || (giruda_ = currentPromise[0]);
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
  VALUE_ORDER = function() {
    return "23456789tjqk1";
  };
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
    if (index == null) {
      index = myIndex;
    }
    return myIndex === jugongIndex;
  };
  isFriend = function(index) {
    if (index == null) {
      index = null;
    }
    if (index == null) {
      index = myIndex;
    }
    return false;
  };
  isFriendKnown = function(index) {
    if (index == null) {
      index = null;
    }
    if (index == null) {
      index = myIndex;
    }
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
    var CARDS, startIndex;
    commitmentIndex = 0;
    startIndex = getRelativeIndexFromIndex(now.lastFriendIndex);
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
        })(), currentPromise[0], currentPromise[1]);
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
  };
  now.notifyRearrangeHandDone = function() {
    var chosen, jugongRIndex;
    if (isJugong()) {
      return;
    }
    jugongRIndex = getRelativeIndexFromIndex(jugongIndex);
    chosen = window.field.hand[jugongIndex];
    while (chosen.length > 3) {
      chosen.remove(chosen[Math.floor(Math.random() * chosen.length)]);
    }
    return window.field.takeCards(0, chosen, function() {
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
        now.chooseFriendByCard(getMightyCard());
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
    if (face === getMightyCard()) {
      return "마이티";
    }
    if (face === 'jr') {
      return "조커";
    }
    suit = SUIT_NAMES[face[0]];
    value = VALUE_NAMES[VALUE_ORDER.indexOf(face[1])];
    return "" + suit + " " + value;
  };
  now.notifyFriendByCard = function(card) {
    card = renderFaceName(card);
    return document.title = buildCommitmentString.apply(null, currentPromise) + ', ' + card + '프렌드';
  };
  now.notifyFriendNone = function() {
    return document.title = buildCommitmentString.apply(null, currentPromise) + ', ' + '프렌드 없음';
  };
  now.notifyFriendFirstTrick = function() {
    return document.title = buildCommitmentString(face, target) + ', ' + '초구 프렌드';
  };
  now.requestChooseCard = function(currentTrick, option) {
    return window.field.chooseCard(function(card) {
      return now.chooseCard(card.face, option);
    });
  };
  now.notifyPlayCard = function(index, card, option) {
    return window.field.playCard(getRelativeIndexFromIndex(index), card, option);
  };
  now.takeTrick = function(winnerIndex) {
    return window.field.endTurn(getRelativeIndexFromIndex(winnerIndex), !(isJugong(winnerIndex) || isFriend(winnerIndex) && isFriendKnown(winnerIndex)));
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
    currentPromise = [face, target];
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
      commitmentIndex = 0;
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
    return window.field.globalMessage(msg);
  };
  now.notifyVote = function(index, face, target) {
    currentPromise = [face, target];
    systemMsg(buildCommitmentString(face, target));
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "공약", buildCommitmentString(face, target));
  };
  now.notifyDealMiss = function(index) {
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "딜미스");
  };
  now.notifyPass = function(index) {
    return window.field.playerMessage(getRelativeIndexFromIndex(index), "패스");
  };
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
  now.ready(function() {
    return now.readyGame();
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
