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
  else if req.url.substr(0,3) == '/js' or req.url.substr(0,4) == '/css' or req.url.substr(0,7) == '/images'
	  res.end fs.readFileSync(__dirname + '/../public' + req.url)
  else
	  res.end html

port = 40037
server.listen port, "0.0.0.0"

nowjs = require 'now'
everyone = nowjs.initialize server

console.log "Server running at http://0.0.0.0:#{port}/"

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
lastTurnWinner = -1

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
		console.log "VOTE request " + nextPlayer
		nowjs.getClient nextPlayer, ->
			@now.requestCommitment()

	else if state == everyone.now.VOTE_KILL
		if players.length == 6
			# if 6 player mode do something and re deal card
			# request jugong to kill card
		else
			changeState everyone.now.REARRANGE_HAND

	else if state == everyone.now.REARRANGE_HAND
		nowjs.getClient players[jugongIndex], ->
			@now.requestRearrangeHand cards[50...53] 
		everyone.now.notifyRearrangeHand()

	else if state == everyone.now.CHOOSE_FRIEND
		nowjs.getClient players[jugongIndex], ->
			@now.requestChooseFriend()
		everyone.now.notifyChooseFriend()

	else if state == everyone.now.TAKE_TURN
		currentTurn = 0
		lastTurnWinner = jugongIndex
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
		changeIndex = Math.floor(Math.random() * (52 - idx)) + idx + 1
		t = cards[idx]
		cards[idx] = cards[changeIndex]
		cards[changeIndex] = t

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
		currentVoteIndex = (currentVoteIndex + 1) % votes.length
		currentVoteIndex = (currentVoteIndex + 1) % votes.length while votes[currentVoteIndex][0] == 'p'
		return players[currentVoteIndex]

allPass = ->
	passes = (vote for vote in votes when vote[0] == 'p')
	return passes.length == votes.length

jugongIndex = null
getJugongIndex = ->
	return jugongIndex

allPassExceptOne = ->
	jugongCount = 0
	for i in [0...votes.length]
		if votes[i][1] == 20 # run
			jugongIndex = i
			jugongCount = 1
			break
		else if votes[i][0] != 'p' and votes[i][1] == 0 # someone not announce
			return false
		else if votes[i][0] != 'p' and votes[i][1] > 10
			jugongIndex = i
			jugongCount += 1
	return jugongCount == 1

checkVoteEnd = ->
	if allPassExceptOne()
		console.log 'vote success jugong: ' + players[jugongIndex]
		everyone.now.notifyJugong jugongIndex, lastVote[0], lastVote[1]
		changeState everyone.now.VOTE_KILL

	else if allPass()
		console.log 'all pass, redeal'
		# TODO 바닦 까고 기본 비드 +1 ?
		everyone.now.notifyMsg "모두 패스하여 다시 카드를 섞습니다."
		redeal()
	else
		nextPlayer = chooseNextPlayerForVote()
		console.log "VOTE request " + nextPlayer
		nowjs.getClient nextPlayer, ->
			@now.requestCommitment()

everyone.now.commitmentAnnounce = (face, target) ->
	idx = indexFromClientId @user.clientId
	console.log face + target + lastVote
	console.log face=='n' and target >= 13
	console.log target >= 14
	console.log lastVote[1] < target
	if (face == 'n' and target >= 13 or target >= 14) and lastVote[1] < target
		votes[idx] = [face, target]
		lastVote = [face, target, idx]
		everyone.now.notifyVote idx, face, target
	else
		@now.requestCommitment()

	checkVoteEnd()

everyone.now.commitmentPass = ->
	idx = indexFromClientId @user.clientId
	votes[idx] = ['p', 0]
	everyone.now.notifyPass idx

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
	return score < 6 - players.length

redeal = ->
	enterState everyone.now.VOTE

everyone.now.commitmentDealMiss = ->
	hand = getHandFromClientId @user.clientId
	if checkDealMiss hand
		everyone.now.notifyDealMiss (indexFromClientId @user.clientId)
		redeal()
	else
		@now.requestCommitment()

resetVote = ->
	votes = (['n',0] for player in players)
	lastVote = ['n',12]
	currentVoteIndex = null
	

################################################################################
# REARRANGE_HAND
################################################################################
everyone.now.rearrangeHand = (cardsToRemove, newFace, newTarget) ->
	replaceIndex = 50
	for idx in [jugongIndex * 10 ... (jugongIndex+1) * 10]
		if cards[idx] in cardsToRemove
			cards[idx] = cards[replaceIndex]
			replaceIndex += 1
	for idx in [50...53]
		cards[idx] = cardsToRemove[idx-50]
		
	everyone.now.notifyRearrangeHandDone()

	if newFace != lastVote[0] and newTarget >= lastVote[1]+2 and newTarget <= 20
		lastVote = [newFace, newTarget, jugongIndex]
		everyone.now.notifyJugong jugongIndex, lastVote[0], lastVote[1]
	changeState everyone.now.CHOOSE_FRIEND

################################################################################
# CHOOSE_FRIEND
################################################################################

everyone.now.chooseFriendByCard = (card) ->
	hand = getHandFromClientId @user.clientId
	if card in hand
		@now.requestChooseFriend()
		return
	everyone.now.notifyFriendByCard card
	afterFriendChoose()

everyone.now.chooseFriendFirstTrick = ->
	everyone.now.notifyFriendFirstTrick
	afterFriendChoose()

everyone.now.chooseFriendNone = ->
	everyone.now.notifyFriendNone
	afterFriendChoose()

afterFriendChoose = ->
	changeState everyone.now.TAKE_TURN

################################################################################
# TAKE_TURN
################################################################################

isValidChoice = (clientId, card, option) ->
	# TODO implement
	hand = getHandFromClientId clientId
	if hand.indexOf(card) == -1
		return false
	true

determineTurnWinner = ->
	# TODO implement
	return Math.floor(Math.random() * 5)

removeCard = (card) ->
	for i in [0..53]
		if cards[i] == card
			cards[i] = ''

everyone.now.chooseCard = (card, option) ->
	if isValidChoice(@user.clientId, card, option)
		currentTrick.push(card)
		removeCard card
		everyone.now.notifyPlayCard (indexFromClientId @user.clientId), card, option
		if currentTrick.length == 5
			# end of one trick
			lastTurnWinner = determineTurnWinner()
			everyone.now.takeTrick lastTurnWinner

			currentTurn += 1
			if currentTurn == 10
				# end of all trick
				now.notifyMsg "우리 모두의 승리!"
			else
				currentTrick = []
				nowjs.getClient players[lastTurnWinner], ->
					@now.requestChooseCard currentTrick, everyone.now.ChooseCardOption.None
		else
			# 다음 사람에게로
			console.log lastTurnWinner
			console.log currentTrick
			console.log currentTrick.length
			console.log (lastTurnWinner + currentTrick.length) % 5
			nowjs.getClient players[(lastTurnWinner + currentTrick.length) % 5], ->
				@now.requestChooseCard currentTrick, everyone.now.ChooseCardOption.None
	else
		# 잘못된 선택 했으니 반복
		@now.requestChooseCard currentTrick, everyone.now.ChooseCardOption.None

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
	step = if players.length == 5 then 10 else 8
	return cards[idx*step...(idx+1)*step]

everyone.now.debugReset = ->
	resetGame()

resetGame = ->
	everyone.now.state = everyone.now.WAITING_PLAYER
	everyone.now.readyCount = 0
	players = []
	playerNames = []
	cards = []
