var exports;
var __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};
if (!(typeof exports !== "undefined" && exports !== null)) {
  exports = this['rule'] = {};
}
exports.VALUE_ORDER = "23456789tjqk1";
exports.Victory = {
  WinByNoticedRun: 1,
  WinByRun: 2,
  Win: 3,
  Lose: 4,
  LoseByBackRun: 5
};
exports.ChooseCardOption = {
  None: 0,
  JokerCall: 1,
  SCome: 2,
  DCome: 3,
  HCome: 4,
  CCome: 5
};
exports.FriendOption = {
  None: 0,
  NoFriend: 1,
  ByCard: 2,
  FirstTrick: 3
};
exports.friendOption = exports.FriendOption.None;
exports.friendKnown = false;
exports.friendIndex = null;
exports.friendCard = null;
exports.friendHandler = function() {};
exports.setFriendHandler = function(handler) {
  return exports.friendHandler = handler;
};
exports.resetFriendOption = function() {
  exports.friendOption = exports.FriendOption.None;
  exports.friendKnown = false;
  return exports.friendIndex = null;
};
exports.setFriend = function(option, arg) {
  if (arg == null) {
    arg = null;
  }
  exports.friendOption = option;
  exports.friendKnown = option === exports.FriendOption.NoFriend;
  exports.friendIndex = -1;
  if (option === exports.FriendOption.ByCard) {
    return exports.friendCard = arg;
  } else {
    return exports.friendCard = null;
  }
};
exports.checkFriendCard = function(index, card) {
  if (exports.friendOption === exports.FriendOption.ByCard && card === exports.friendCard) {
    exports.friendKnown = true;
    exports.friendIndex = index;
    return exports.friendHandler(index);
  }
};
exports.checkFriendEndTurn = function(winnerIndex) {
  if (exports.friendOption === exports.FriendOption.FirstTrick && exports.currentTurn === 0) {
    exports.friendKnown = true;
    exports.friendIndex = winnerIndex;
    return exports.friendHandler(winnerIndex);
  }
};
exports.isFriendByHand = function(hand) {
  var _ref;
  return exports.friendOption === exports.FriendOption.ByCard && (_ref = exports.friendCard, __indexOf.call(hand, _ref) >= 0);
};
exports.isFriend = function(index) {
  return exports.friendKnown && index === exports.friendIndex;
};
exports.isFriendKnown = function() {
  return exports.friendKnown;
};
exports.currentTrick = [];
exports.currentTurn = 0;
exports.addTrick = function(card, index) {
  if (index == null) {
    index = null;
  }
  exports.currentTrick.push(card);
  if (index != null) {
    return exports.checkFriendCard(index, card);
  }
};
exports.resetTrick = function(winnerIndex) {
  if (winnerIndex == null) {
    winnerIndex = null;
  }
  exports.currentTrick = [];
  if (winnerIndex != null) {
    exports.checkFriendEndTurn(winnerIndex);
    return exports.currentTurn += 1;
  }
};
exports.getCurrentTrickFace = function(currentTrickOption) {
  if (exports.currentTrick.length === 0) {
    return 'n';
  }
  if (currentTrickOption === exports.ChooseCardOption.CCome) {
    return 'c';
  }
  if (currentTrickOption === exports.ChooseCardOption.HCome) {
    return 'h';
  }
  if (currentTrickOption === exports.ChooseCardOption.SCome) {
    return 's';
  }
  if (currentTrickOption === exports.ChooseCardOption.DCome) {
    return 'd';
  }
  if (exports.currentTrick[0] === 'jr') {
    if (exports.currentTrick.length > 1) {
      return exports.currentTrick[1][0];
    } else {
      return 'n';
    }
  }
  return exports.currentTrick[0][0];
};
exports.currentPromise = null;
exports.setPromise = function(promise) {
  exports.currentPromise = promise;
  return exports.currentTurn = 0;
};
exports.resetPromise = function() {
  exports.currentPromise = null;
  exports.currentTurn = 0;
  return exports.currentTrick = [];
};
exports.getMightyCard = function() {
  if ((exports.currentPromise != null) && exports.currentPromise[0] === 's') {
    return 'd1';
  }
  return 's1';
};
exports.getJokerCallCard = function() {
  if ((exports.currentPromise != null) && exports.currentPromise[0] === 'c') {
    return 's3';
  }
  return 'c3';
};
exports.hasFace = function(cards, face) {
  var card, _i, _len;
  for (_i = 0, _len = cards.length; _i < _len; _i++) {
    card = cards[_i];
    if (card[0] === face) {
      return true;
    }
  }
  return false;
};
exports.isSameFace = function(card, face) {
  return face === 'n' || card[0] === face;
};
exports.isValidChoice = function(hand, card, option, currentTurn) {
  if (hand.indexOf(card) === -1) {
    return false;
  }
  if (exports.currentTrick.length === 0) {
    if (option !== exports.ChooseCardOption.None) {
      if (option === exports.ChooseCardOption.JokerCall) {
        return card === exports.getJokerCallCard() && currentTurn !== 0;
      } else if (option === exports.ChooseCardOption.SCome || option === exports.ChooseCardOption.DCome || option === exports.ChooseCardOption.HCome || option === exports.ChooseCardOption.CCome) {
        return card === 'jr' && currentTurn !== 0 && currentTurn !== 9;
      }
    } else if (card === 'jr') {
      return exports.currentPromise === 0 || currentTurn === 9;
    } else if ((exports.currentPromise != null) && card[0] === exports.currentPromise[0] && currentTurn === 0) {
      return false;
    }
  } else {
    if (card === exports.getMightyCard()) {
      return true;
    } else if (card === 'jr') {
      return true;
    } else if ((exports.hasFace(hand, 'j')) && option === exports.ChooseCardOption.JokerCall && card !== 'jr') {
      return false;
    } else if (exports.currentTrick.length > 0 && (exports.hasFace(hand, exports.getCurrentTrickFace(option))) && !exports.isSameFace(card, exports.getCurrentTrickFace(option))) {
      return false;
    }
  }
  return true;
};
exports.determineTurnWinner = function(currentTrickOption, currentTurn) {
  var i, maxScoreIndex, scores;
  scores = [0, 0, 0, 0, 0];
  for (i = 0; i < 5; i++) {
    if (exports.currentTrick[i] === exports.getMightyCard()) {
      return i;
    } else if (exports.currentTrick[i] === 'jr') {
      if (currentTrickOption === exports.ChooseCardOption.JokerCall || currentTurn === 0 || currentTurn === 9) {
        scores[i] = 0;
      } else {
        scores[i] = 1000;
      }
    } else if (exports.currentTrick[i][0] === exports.currentPromise[0]) {
      scores[i] = 200 + exports.VALUE_ORDER.indexOf(exports.currentTrick[i][1]);
    } else if (exports.currentTrick[i][0] === exports.getCurrentTrickFace(currentTrickOption)) {
      scores[i] = 100 + exports.VALUE_ORDER.indexOf(exports.currentTrick[i][1]);
    } else {
      scores[i] = 0;
    }
  }
  maxScoreIndex = 0;
  for (i = 1; i < 5; i++) {
    if (scores[i] > scores[maxScoreIndex]) {
      maxScoreIndex = i;
    }
  }
  return maxScoreIndex;
};
exports.checkDealMiss = function(cards) {
  var card, score, _i, _len, _ref;
  score = 0;
  for (_i = 0, _len = cards.length; _i < _len; _i++) {
    card = cards[_i];
    if ((_ref = card[1]) === '1' || _ref === 'j' || _ref === 'k' || _ref === 'q') {
      if (card === exports.getMightyCard()) {
        score += 0;
      } else {
        score += 1;
      }
    } else if (card[1] === 't') {
      score += 0.5;
    } else if (card[0] === 'j') {
      score -= 1;
    }
  }
  return score < 1;
};
exports.resetGame = function() {
  exports.resetFriendOption();
  return exports.resetPromise();
};
exports.encodeState = function() {
  return [exports.currentTrick, exports.currentTurn, exports.friendOption, exports.friendKnown, exports.friendIndex, exports.friendCard, exports.currentPromise];
};
exports.decodeState = function(o) {
  return exports.currentTrick = o[0], exports.currentTurn = o[1], exports.friendOption = o[2], exports.friendKnown = o[3], exports.friendIndex = o[4], exports.friendCard = o[5], exports.currentPromise = o[6], o;
};