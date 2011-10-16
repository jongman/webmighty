if not exports?
	exports = this['db'] = {}

dbcfg = require('./db.cfg')

# currently using redis; can change
redis = require('redis')
client = redis.createClient(40337, 'upnl.org')

class Stat
	constructor: (@userId, @key, @jw, @jl, @fw, @fl, @yw, @yl)->
		@jw ?= 0
		@jl ?= 0
		@fw ?= 0
		@fl ?= 0
		@yw ?= 0
		@yl ?= 0
	inc: (v) ->
		this[v] *= 1
		this[v] += 1
		client.incr("#{@userId}:#{@key}:#{v}")
	inc_jw: -> @inc('jw')
	inc_jl: -> @inc('jl')
	inc_fw: -> @inc('fw')
	inc_fl: -> @inc('fl')
	inc_yw: -> @inc('yw')
	inc_yl: -> @inc('yl')
	save: ->
		client.set("#{@userId}:#{@key}:jw", @jw)
		client.set("#{@userId}:#{@key}:jl", @jl)
		client.set("#{@userId}:#{@key}:fw", @fw)
		client.set("#{@userId}:#{@key}:fl", @fl)
		client.set("#{@userId}:#{@key}:yw", @yw)
		client.set("#{@userId}:#{@key}:yl", @yl)
		if @key == "daily"
			current = new Date()
			expireDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 6, 0, 0)
			if(expireDate < current)
				expireDate.setDate(expireDate.getDate()+1)
			client.expireat("#{@userId}:daily:jw", expireDate.UTC())
			client.expireat("#{@userId}:daily:jl", expireDate.UTC())
			client.expireat("#{@userId}:daily:fw", expireDate.UTC())
			client.expireat("#{@userId}:daily:fl", expireDate.UTC())
			client.expireat("#{@userId}:daily:yw", expireDate.UTC())
			client.expireat("#{@userId}:daily:yl", expireDate.UTC())

class UserStat
	constructor: (@id, @daily, @total) ->
	inc_jw: ->
		@daily.inc_jw()
		@total.inc_jw()
	inc_jl: ->
		@daily.inc_jl()
		@total.inc_jl()
	inc_fw: ->
		@daily.inc_fw()
		@total.inc_fw()
	inc_fl: ->
		@daily.inc_fl()
		@total.inc_fl()
	inc_yw: ->
		@daily.inc_yw()
		@total.inc_yw()
	inc_yl: ->
		@daily.inc_yl()
		@total.inc_yl()
	save: ->
		@daily.save()
		@total.save()

exports.getUserStat = (userId, callback) ->
	client.mget([
		"#{userId}:daily:jw",
		"#{userId}:daily:jl",
		"#{userId}:daily:fw",
		"#{userId}:daily:fl",
		"#{userId}:daily:yw",
		"#{userId}:daily:yl",
		"#{userId}:total:jw",
		"#{userId}:total:jl",
		"#{userId}:total:fw",
		"#{userId}:total:fl",
		"#{userId}:total:yw",
		"#{userId}:total:yl"], (err, a) ->
			callback new UserStat(userId, new Stat(userId, 'daily', a[0...6]...), new Stat(userId, 'total', a[6...12]...))
			
	)
