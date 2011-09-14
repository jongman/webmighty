fs = require 'fs'
html = fs.readFileSync(__dirname + '/main.html')
jqueryjs = fs.readFileSync(__dirname + '/jquery-1.6.2.min.js')
http = require('http')
server = http.createServer (req, res) ->
  if (req.url == '/jquery-1.6.2.min.js')
	  res.writeHead 200, {'Content-Type': 'text/javascript'}
	  res.end jqueryjs
  else
	  res.end html

server.listen 1337, "127.0.0.1"

nowjs = require 'now'
everyone = nowjs.initialize server

console.log 'Server running at http://127.0.0.1:1337/'

everyone.now.loginCount = 0
nowjs.on 'connect', ->
	everyone.now.loginCount += 1
	this.now.name = 'player' + everyone.now.loginCount
	this.now.showName()

everyone.now.distributeMessage = (message) ->
	  everyone.now.receiveMessage @now.name, message

everyone.now.WAITING_PLAYER = 1
everyone.now.VOTE = 2
everyone.now.VOTE_KILL = 3
everyone.now.REARRANGE_HAND = 4
everyone.now.CHOOSE_FRIEND = 5
everyone.now.TAKE_TURN = 6
everyone.now.END_GAME = 7
	
everyone.now.state = everyone.now.WAITING_PLAYER
everyone.now.readyCount = 0
players = []
cards = []

everyone.now.chat = (msg) ->
	everyone.now.receiveChat @now.clientId, @now.name, msg

enterState = (state) ->
	# TODO refactor to state pattern
	if state == everyone.now.VOTE
		resetVote()
		dealCard()
		nextPlayer = chooseNextPlayerForVote()
		nowjs.getClient nextPlayer, ->
			@now.requestCommitment()

changeState = (state) ->
	everyone.now.state = state
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
	for player in players
		console.log (player + " gets " + cards[idx...idx+10])
		nowjs.getClient player, ->
			@now.receiveDealtCards cards[idx...idx+10]
		idx += 10

################################################################################
# WAITING FOR PLAYERS : be ready 5 heroes
################################################################################

everyone.now.readyGame = ->
	if everyone.now.state != everyone.now.WAITING_PLAYER
		return
	everyone.now.readyCount = everyone.now.readyCount + 1
	setReady @user.clientId, @now.name
	console.log "READY " + everyone.now.readyCount
	if everyone.now.readyCount == 5
		console.log "DEALING"
		changeState everyone.now.VOTE 
	# don't implement 6 player for now
	#else if everyone.now.readyCount == 6
		#changeState(everyone.now.VOTE)


setReady = (clientId, name) ->
	console.log(clientId)
	players.push(clientId)
	nowjs.getGroup('players').addUser(clientId)
	everyone.now.setReady clientId, name


################################################################################
# VOTE
################################################################################

votes = null
lastVote = null
currentVoteIndex = null

getLastFriendIndex =  ->
	return Math.floor(Math.random()*votes.length)

chooseNextPlayerForVote = () ->
	if currentVoteIndex?
		currentVoteIndex = getLastFriendIndex()
		return currentVoteIndex
	else
		currentVoteIndex = (currentVoteIndex + 1) % votes.length while votes[currentVoteIndex][0] == 'p'
		return currentVoteIndex

allPass = ->
	passes = (vote for vote in votes when vote[0] == 'p')
	return passes.length == votes.length

everyone.now.commitmentAnnounce = (face, target) ->
	idx = indexFromClientId @user.clientId
	if (face == 'n' and target >= 13 or target >= 14) and lastVote[1] < target
		votes[idx] = [face, target]
		lastVote = [face, target, idx]

	if allPass()
		redeal()
	else
		nextPlayer = chooseNextPlayerForVote()
		nowjs.getClient nextPlayer, ->
			@now.requestCommitment()

everyone.now.commitmentPass = ->
	idx = indexFromClientId @user.clientId
	votes[idx] = ['p', 0]

	if allPass()
		redeal()
	else
		nextPlayer = chooseNextPlayerForVote()
		nowjs.getClient nextPlayer, ->
			@now.requestCommitment()

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
	return score < 1

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
# Miscellaneous
################################################################################

indexFromClientId = (clientId) ->
	return players.indexOf clientId

getHandFromClientId = (clientId) ->
	idx = indexFromClientId clientId
	return cards[idx*10...(idx+1)*10]

everyone.now.debugReset = ->
	everyone.now.state = everyone.now.WAITING_PLAYER
	everyone.now.readyCount = 0
	players = []
	cards = []
