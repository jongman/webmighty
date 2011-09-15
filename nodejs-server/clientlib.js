(function() {
  var FACE_ORDER, NetworkUser, VALUE_ORDER, client2index, getIndexFromRelativeIndex, getRelativeIndexFromClientId, getRelativeIndexFromIndex, giruda, myIndex, name2index, systemMsg, users;
  window.LIBGAME = 1;
  systemMsg = function(msg) {
    return $('#log').html(function(index, oldHtml) {
      return oldHtml + '<BR>' + msg;
    });
  };
  giruda = 'n';
  name2index = {};
  client2index = {};
  myIndex = 0;
  users = {};
  FACE_ORDER = function(giruda_) {
    if (giruda_ == null) {
      giruda_ = null;
    }
    giruda_ || (giruda_ = giruda);
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
  now.requestCommitment = function() {
    return systemMsg("공약 내세우기");
  };
  now.receiveDealtCards = function(cards) {
    var CARDS, startIndex;
    startIndex = getRelativeIndexFromIndex(now.lastFriendIndex);
    CARDS = [cards, ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"], ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]];
    return window.field.deal(CARDS, 1, function() {});
  };
  NetworkUser = (function() {
    function NetworkUser(clientId, name, index) {
      this.clientId = clientId;
      this.name = name;
      this.index = index;
      client2index[this.clientId] = index;
    }
    return NetworkUser;
  })();
  now.notifyChangeState = function(newState) {
    var ridx;
    systemMsg('여기 왜 안불림요' + newState + now.VOTE);
    if (newState === now.VOTE) {
      window.field.setPlayers((function() {
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
    }
    if (newState === now.END_GAME) {
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
      users[index] = new NetworkUser(clientId, name, index);
      name2index[name] = index;
      _results.push(client2index[clientId] = index);
    }
    return _results;
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
    return systemMsg('i am ' + this.now.name);
  };
  now.ready(function() {
    return now.readyGame();
  });
}).call(this);
