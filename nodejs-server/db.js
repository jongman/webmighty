var Stat, UserStat, client, dbcfg, exports, redis;
var __slice = Array.prototype.slice;
if (!(typeof exports !== "undefined" && exports !== null)) {
  exports = this['db'] = {};
}
dbcfg = require('./db.cfg');
redis = require('redis');
client = redis.createClient(40337, 'upnl.org');
Stat = (function() {
  function Stat(userId, key, jw, jl, fw, fl, yw, yl) {
    var _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
    this.userId = userId;
    this.key = key;
    this.jw = jw;
    this.jl = jl;
    this.fw = fw;
    this.fl = fl;
    this.yw = yw;
    this.yl = yl;
    if ((_ref = this.jw) == null) {
      this.jw = 0;
    }
    if ((_ref2 = this.jl) == null) {
      this.jl = 0;
    }
    if ((_ref3 = this.fw) == null) {
      this.fw = 0;
    }
    if ((_ref4 = this.fl) == null) {
      this.fl = 0;
    }
    if ((_ref5 = this.yw) == null) {
      this.yw = 0;
    }
    if ((_ref6 = this.yl) == null) {
      this.yl = 0;
    }
  }
  Stat.prototype.inc = function(v) {
    this[v] *= 1;
    this[v] += 1;
    return client.incr("" + this.userId + ":" + this.key + ":" + v);
  };
  Stat.prototype.inc_jw = function() {
    return this.inc('jw');
  };
  Stat.prototype.inc_jl = function() {
    return this.inc('jl');
  };
  Stat.prototype.inc_fw = function() {
    return this.inc('fw');
  };
  Stat.prototype.inc_fl = function() {
    return this.inc('fl');
  };
  Stat.prototype.inc_yw = function() {
    return this.inc('yw');
  };
  Stat.prototype.inc_yl = function() {
    return this.inc('yl');
  };
  Stat.prototype.save = function() {
    var current, expireDate;
    client.set("" + this.userId + ":" + this.key + ":jw", this.jw);
    client.set("" + this.userId + ":" + this.key + ":jl", this.jl);
    client.set("" + this.userId + ":" + this.key + ":fw", this.fw);
    client.set("" + this.userId + ":" + this.key + ":fl", this.fl);
    client.set("" + this.userId + ":" + this.key + ":yw", this.yw);
    client.set("" + this.userId + ":" + this.key + ":yl", this.yl);
    if (this.key === "daily") {
      current = new Date();
      expireDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 6, 0, 0);
      if (expireDate < current) {
        expireDate.setDate(expireDate.getDate() + 1);
      }
      client.expireat("" + this.userId + ":daily:jw", expireDate.UTC());
      client.expireat("" + this.userId + ":daily:jl", expireDate.UTC());
      client.expireat("" + this.userId + ":daily:fw", expireDate.UTC());
      client.expireat("" + this.userId + ":daily:fl", expireDate.UTC());
      client.expireat("" + this.userId + ":daily:yw", expireDate.UTC());
      return client.expireat("" + this.userId + ":daily:yl", expireDate.UTC());
    }
  };
  return Stat;
})();
UserStat = (function() {
  function UserStat(id, daily, total) {
    this.id = id;
    this.daily = daily;
    this.total = total;
  }
  UserStat.prototype.inc_jw = function() {
    this.daily.inc_jw();
    return this.total.inc_jw();
  };
  UserStat.prototype.inc_jl = function() {
    this.daily.inc_jl();
    return this.total.inc_jl();
  };
  UserStat.prototype.inc_fw = function() {
    this.daily.inc_fw();
    return this.total.inc_fw();
  };
  UserStat.prototype.inc_fl = function() {
    this.daily.inc_fl();
    return this.total.inc_fl();
  };
  UserStat.prototype.inc_yw = function() {
    this.daily.inc_yw();
    return this.total.inc_yw();
  };
  UserStat.prototype.inc_yl = function() {
    this.daily.inc_yl();
    return this.total.inc_yl();
  };
  UserStat.prototype.save = function() {
    this.daily.save();
    return this.total.save();
  };
  return UserStat;
})();
exports.getUserStat = function(userId, callback) {
  return client.mget(["" + userId + ":daily:jw", "" + userId + ":daily:jl", "" + userId + ":daily:fw", "" + userId + ":daily:fl", "" + userId + ":daily:yw", "" + userId + ":daily:yl", "" + userId + ":total:jw", "" + userId + ":total:jl", "" + userId + ":total:fw", "" + userId + ":total:fl", "" + userId + ":total:yw", "" + userId + ":total:yl"], function(err, a) {
    return callback(new UserStat(userId, (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(Stat, [userId, 'daily'].concat(__slice.call(a.slice(0, 6))), function() {}), (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(Stat, [userId, 'total'].concat(__slice.call(a.slice(6, 12))), function() {})));
  });
};