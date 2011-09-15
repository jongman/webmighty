fs = require 'fs'
html = fs.readFileSync(__dirname + '/main.html')
testhtml = fs.readFileSync(__dirname + '/test.html')
jqueryjs = fs.readFileSync(__dirname + '/jquery-1.6.2.min.js')
clientjs = fs.readFileSync(__dirname + '/clientlib.js')
http = require('http')
server = http.createServer (req, res) ->
  if req.url == '/js/clientlib.js'
	  res.writeHead 200, {'Content-Type': 'text/javascript'}
	  clientjs = fs.readFileSync(__dirname + '/clientlib.js')
	  res.end clientjs
  else if req.url == '/test'
	  res.end testhtml
  else if req.url == '/js/jquery-1.6.2.min.js'
	  res.writeHead 200, {'Content-Type': 'text/javascript'}
	  res.end jqueryjs
  else if req.url == '/public'
	  res.writeHead 200, {'Content-Type': 'text/html'}
	  res.end fs.readFileSync(__dirname + '/..' + req.url + '/index.html')
  else if req.url.substr(0,3) == '/js' or req.url.substr(0,4) == '/css' or req.url.substr(0,7) == '/images'
	  res.end fs.readFileSync(__dirname + '/../public' + req.url)
  #else if req.url.substr(0,7) == '/public'
	  #res.end fs.readFileSync(__dirname + '/..' + req.url)
  else
	  res.end html

server.listen 1337, "127.0.0.1"

nowjs = require 'now'
everyone = nowjs.initialize server

console.log 'Server running at http://127.0.0.1:1337/'

everyone.now.loginCount = 0
nowjs.on 'connect', ->
	everyone.now.loginCount += 1
	@now.name ?= 'player' + everyone.now.loginCount
	@now.showName()

everyone.now.distributeMessage = (message) ->
	  everyone.now.receiveMessage @now.name, message

everyone.now.WAITING_PLAYER = 1
everyone.now.VOTE = 2
everyone.now.VOTE_KILL = 3
everyone.now.REARRANGE_HAND = 4
everyone.now.CHOOSE_FRIEND = 5
everyone.now.TAKE_TURN = 6
everyone.now.END_GAME = 7

everyone.now.ChooseCardOption = 
	None: 0
	JokerCall: 1
	SCome: 2
	DCome: 3
	HCome: 4
	CCome: 5
	
everyone.now.state = everyone.now.WAITING_PLAYER
everyone.now.readyCount = 0
players = []
playerNames = []
cards = []
currentTurn = 0
currentTrick = []

everyone.now.chat = (msg) ->
	everyone.now.receiveChat @now.clientId, @now.name, msg

enterState = (state) ->
	# TODO refactor to state pattern
	if state == everyone.now.WAITING_PLAYER
		resetGame()
	else if state == everyone.now.VOTE
		resetVote()
		dealCard()
		nextPlayer = chooseNextPlayerForVote()
		nowjs.getClient nextPlayer, ->
			@now.requestCommitment()

	else if state == everyone.now.VOTE_KILL
		if players.length == 6
			# if 6 player mode do something and re deal card
			# request jugong to kill card
		else
			changeState everyone.now.REARRANGE_HAND


	else if state == everyone.now.REARRANGE_HAND
		nowjs.getClient players[jugongIdx], ->
			@now.requestRearrangeHand cards[50...53] 

	else if state == everyone.now.CHOOSE_FRIEND
		nowjs.getClient players[jugongIdx], ->
			@now.requestChooseFriend()

	else if state == everyone.now.TAKE_TURN
		currentTurn = 0
		lastTurnWinner = jugongIdx
		currentTrick = []
		nowjs.getClient players[lastTurnWinner], ->
			@now.requestChooseCard currentTrick, everyone.now.ChooseCardOption.None

	else if state == everyone.now.END_GAME
		# 결과 보여주고 일정 시간 후 waiting 상태로 
		setTimeout (->
			changeState everyone.now.WAITING_PLAYER
			, 5000)

changeState = (state) ->
	console.log 'new state ' + state
	everyone.now.state = state
	everyone.now.notifyChangeState(state)
	enterState state

dealCard = ->
	cards = ['jr']
	for face in ['c', 's', 'h', 'd']
		for num in [1..9].concat ['t', 'j', 'k', 'q']
			cards.push(face + num)

	console.log 'shuffling'
	for idx in [0...52]
		changeIdx = Math.floor(Math.random() * (52 - idx)) + idx + 1
		t = cards[idx]
		cards[idx] = cards[changeIdx]
		cards[changeIdx] = t

	console.log players
	idx = 0
	if players.length == 6
		step = 8
	else
		step = 10
	for player in players
		console.log (player + " gets " + cards[idx...idx+step])
		nowjs.getClient player, ->
			@now.receiveDealtCards cards[idx...idx+step]
		idx += step

################################################################################
# WAITING_PLAYER : be ready 5 heroes
################################################################################

everyone.now.readyGame = ->
	if everyone.now.state != everyone.now.WAITING_PLAYER
		return
	everyone.now.readyCount = everyone.now.readyCount + 1
	setReady @user.clientId, @now.name
	console.log "READY " + everyone.now.readyCount
	if everyone.now.readyCount == 5
		console.log "DEALING"
		everyone.now.notifyPlayers players, playerNames
		changeState everyone.now.VOTE 
	# don't implement 6 player for now
	#else if everyone.now.readyCount == 6
		#changeState(everyone.now.VOTE)


setReady = (clientId, name) ->
	console.log(clientId)
	players.push(clientId)
	playerNames.push(name)
	nowjs.getGroup('players').addUser(clientId)
	everyone.now.notifyReady clientId, name, players.length - 1


################################################################################
# VOTE
################################################################################

votes = null
lastVote = null
currentVoteIndex = null

everyone.now.lastFriendIndex = 0

chooseNextPlayerForVote = () ->
	if not currentVoteIndex?
		currentVoteIndex = everyone.now.lastFriendIndex
		return players[currentVoteIndex]
	else
		currentVoteIndex = (currentVoteIndex + 1) % votes.length while votes[currentVoteIndex][0] == 'p'
		return players[currentVoteIndex]

allPass = ->
	passes = (vote for vote in votes when vote[0] == 'p')
	return passes.length == votes.length

jugongIdx = null
getJugongIdx = ->
	return jugongIdx

allPassExceptOne = ->
	jugongCount = 0
	for i in [0...votes.length]
		if votes[i][0] != 'p' and votes[i][1] > 10
			jugongIdx = i
			jugongCount += 1
		else if votes[i][1] == 20 # run
			jugongIdx = i
			jugongCount = 1
			break
	return jugongCount == 1

checkVoteEnd = ->
	if allPassExceptOne()
		changeState everyone.now.VOTE_KILL
	else if allPass()
		redeal()
	else
		nextPlayer = chooseNextPlayerForVote()
		nowjs.getClient nextPlayer, ->
			@now.requestCommitment()

everyone.now.commitmentAnnounce = (face, target) ->
	idx = indexFromClientId @user.clientId
	if (face == 'n' and target >= 13 or target >= 14) and lastVote[1] < target
		votes[idx] = [face, target]
		lastVote = [face, target, idx]

	checkVoteEnd()

everyone.now.commitmentPass = ->
	idx = indexFromClientId @user.clientId
	votes[idx] = ['p', 0]

	checkVoteEnd()

checkDealMiss = (cards) ->
	# TODO implement deal miss options
	score = 0
	for card in cards
		if card[1] in ['1','j','k','q']
			if lastVote[0] == 's' and card[0] == 'd'
				# mighty with spade giruda
				score += 0
			else if lastVote[0] != 's' and card[0] == 's'
				# mighty with non-spade giruda
				score += 0
			else
				score += 1
		if card[1] == 't'
			score += 0.5
		if card[0] == 'j'
			score -= 1
	return score < 6 - player.length

redeal = ->
	enterState everyone.now.VOTE

everyone.now.commitmentDealMiss = ->
	hand = getHandFromClientId @user.clientId
	if checkDealMiss hand
		redeal()

resetVote = ->
	votes = [null for player in players]
	lastVote = ['n',12]
	currentVoteIndex = null
	

################################################################################
# REARRANGE_HAND
################################################################################

################################################################################
# CHOOSE_FRIEND
################################################################################

everyone.now.chooseFriendByCard = (card) ->
	everyone.now.notifyFriendByCard card

everyone.now.chooseFriendNone = ->
	everyone.now.notifyFriendNone

################################################################################
# TAKE_TURN
################################################################################

################################################################################
# END_GAME
################################################################################

################################################################################
# Miscellaneous
################################################################################

indexFromClientId = (clientId) ->
	return players.indexOf clientId

getHandFromClientId = (clientId) ->
	idx = indexFromClientId clientId
	step = if player.length == 5 then 10 else 8
	return cards[idx*step...(idx+1)*step]

everyone.now.debugReset = ->
	resetGame()
resetGame = ->
	everyone.now.state = everyone.now.WAITING_PLAYER
	everyone.now.readyCount = 0
	players = []
	playerNames = []
	cards = []
