rule = require './rule'

################################################################################
# Server init
################################################################################

fs = require 'fs'
html = fs.readFileSync(__dirname + '/main.html')
testhtml = fs.readFileSync(__dirname + '/test.html')
jqueryjs = fs.readFileSync(__dirname + '/jquery-1.6.2.min.js')
http = require('http')
server = http.createServer (req, res) ->
	# hand implemented serving. 젤 더러운 하드코딩
  if req.url == '/js/clientlib.js'
	  res.writeHead 200, {'Content-Type': 'text/javascript'}
	  clientjs = fs.readFileSync(__dirname + '/clientlib.js')
	  res.end clientjs
  else if req.url == '/js/rule.js'
	  res.writeHead 200, {'Content-Type': 'text/javascript'}
	  clientjs = fs.readFileSync(__dirname + '/rule.js')
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

nowjs = require 'now'
everyone = nowjs.initialize server

################################################################################
# Logic
################################################################################

everyone.now.loginCount = 0
nowjs.on 'connect', ->
	everyone.now.loginCount += 1
	@now.name ?= 'player' + everyone.now.loginCount
	@now.showName()

	# TODO room
	#nowjs.getGroup('room-1').addUser(@user.clientId)

	# TODO observer connect inside game
	#if everyone.now.state != everyone.now.WAITING_PLAYER
		#nowjs.getGroup('observer-1').addUser(@user.clientId)

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
playerNames = []
cards = []
currentTurn = 0
currentTrickOption = null
lastTurnWinner = -1
scores = null
everyone.now.lastFriendIndex = 0
jugongIndex = null

everyone.now.chat = (msg) ->
	everyone.now.receiveChat @now.clientId, @now.name, msg

enterState = (state) ->
	# TODO refactor to state pattern
	if state == everyone.now.WAITING_PLAYER
		resetGame()
	else if state == everyone.now.VOTE
		scores = [0,0,0,0,0]
		lastFriendIndex = rule.friendIndex
		lastFriendIndex ?= jugongIndex
		lastFriendIndex ?= 0
		rule.resetFriendOption()
		redeal()

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
		rule.resetTrick()
		nowjs.getClient players[lastTurnWinner], ->
			@now.requestChooseCard currentTurn, rule.ChooseCardOption.None

	else if state == everyone.now.END_GAME
		# 결과 보여주고 일정 시간 후 VOTE 상태로 
		endGame()

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
	players.push(clientId)
	playerNames.push(name)
	#nowjs.getGroup('players').addUser(clientId)
	everyone.now.notifyReady clientId, name, players.length - 1


################################################################################
# VOTE
################################################################################

votes = null
currentVoteIndex = null

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
		everyone.now.notifyJugong jugongIndex, rule.currentPromise[0], rule.currentPromise[1]
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
	if (face == 'n' and target >= 13 or target >= 14) and (not rule.currentPromise? or rule.currentPromise[1] < target)
		votes[idx] = [face, target]
		rule.setPromise [face, target, idx]
		everyone.now.notifyVote idx, face, target
	else
		@now.requestCommitment()

	checkVoteEnd()

everyone.now.commitmentPass = ->
	idx = indexFromClientId @user.clientId
	votes[idx] = ['p', 0]
	everyone.now.notifyPass idx

	checkVoteEnd()

redeal = ->
	votes = (['n',0] for player in players)
	rule.resetGame()
	currentVoteIndex = null
	dealCard()
	nextPlayer = chooseNextPlayerForVote()
	console.log "VOTE request " + nextPlayer
	nowjs.getClient nextPlayer, ->
		@now.requestCommitment()

everyone.now.commitmentDealMiss = ->
	hand = getHandFromClientId @user.clientId
	if rule.checkDealMiss hand
		everyone.now.notifyDealMiss (indexFromClientId @user.clientId)
		redeal()
	else
		@now.requestCommitment()

################################################################################
# REARRANGE_HAND
################################################################################
everyone.now.rearrangeHand = (cardsToRemove, newFace, newTarget) ->
	replaceIndex = 50
	console.log getHandFromClientId @user.clientId
	console.log cardsToRemove
	console.log cards[50...53]
	replaceIndex += 1 while cards[replaceIndex] in cardsToRemove and replaceIndex < 53
	for idx in [jugongIndex * 10 ... (jugongIndex+1) * 10]
		if cards[idx] in cardsToRemove
			t = cards[idx]
			cards[idx] = cards[replaceIndex]
			cards[replaceIndex] = t

			replaceIndex += 1 while cards[replaceIndex] in cardsToRemove and replaceIndex < 53
			if replaceIndex == 53
				break
	console.log getHandFromClientId @user.clientId
	console.log cards[50...53]
		
	everyone.now.notifyRearrangeHandDone()

	#TODO RULESET
	if newFace != rule.currentPromise[0] and newTarget <= 20 and (newTarget >= rule.currentPromise[1]+2 or newTarget == 20 or (newFace == 'n' or rule.currentPromise[0] == 'n') and newTarget >= rule.currentPromise[1] + 1)
		rule.setPromise [newFace, newTarget, jugongIndex]
		everyone.now.notifyJugong jugongIndex, rule.currentPromise[0], rule.currentPromise[1]
	changeState everyone.now.CHOOSE_FRIEND

################################################################################
# CHOOSE_FRIEND
################################################################################

friendHandler = (index) ->
	everyone.now.lastFriendIndex = index
	console.log "friend is " + playerNames[index]

rule.setFriendHandler friendHandler

everyone.now.chooseFriendByCard = (card) ->
	hand = getHandFromClientId @user.clientId
	if card in hand
		@now.requestChooseFriend()
		return
	rule.setFriend rule.FriendOption.ByCard, card
	everyone.now.notifyFriendByCard card
	afterFriendChoose()

everyone.now.chooseFriendFirstTrick = ->
	rule.setFriend rule.FriendOption.FirstTrick
	everyone.now.notifyFriendFirstTrick
	afterFriendChoose()

everyone.now.chooseFriendNone = ->
	rule.setFriend rule.FriendOption.NoFriend
	everyone.now.notifyFriendNone
	afterFriendChoose()

afterFriendChoose = ->
	changeState everyone.now.TAKE_TURN

################################################################################
# TAKE_TURN
################################################################################


removeCard = (card) ->
	cards[cards.indexOf(card)] = ''

everyone.now.chooseCard = (card, option) ->
	if rule.currentTrick.length > 0
		option = currentTrickOption
	if rule.isValidChoice((getHandFromClientId @user.clientId), card, option, currentTurn)
		if rule.currentTrick.length == 0
			currentTrickOption = option
		rule.addTrick(card, (lastTurnWinner + rule.currentTrick.length)%5)
		removeCard card
		everyone.now.notifyPlayCard (indexFromClientId @user.clientId), card, option
		if rule.currentTrick.length == 5
			# end of one trick
			lastTurnWinner = (lastTurnWinner + rule.determineTurnWinner(currentTrickOption, currentTurn))%5
			for card in rule.currentTrick
				if card[1] in "tjqk1"
					scores[lastTurnWinner] += 1 
			everyone.now.takeTrick currentTurn, lastTurnWinner

			currentTurn += 1
			if currentTurn == 10
				# end of all trick
				changeState everyone.now.END_GAME
			else
				rule.resetTrick(lastTurnWinner)
				nowjs.getClient players[lastTurnWinner], ->
					@now.requestChooseCard currentTurn, rule.ChooseCardOption.None
		else
			# 다음 사람에게로
			console.log rule.currentTrick
			nowjs.getClient players[(lastTurnWinner + rule.currentTrick.length) % 5], ->
				@now.requestChooseCard currentTurn, currentTrickOption
	else
		# 잘못된 선택 했으니 반복
		console.log "#{@user.clientId} cant put #{card} with #{option}"
		console.log (getHandFromClientId @user.clientId)
		@now.requestChooseCard currentTurn, currentTrickOption

################################################################################
# END_GAME
################################################################################
endGame = ->
	assertTrue 20 >= scores[0]+scores[1]+scores[2]+scores[3]+scores[4] # 묻는거 때문에 20안됨
	rulers = [jugongIndex]
	if rule.friendIndex?
		rulers.push(rule.friendIndex)
	# 묻은게 여당 득점이므로 20 - 야당 먹은거로 여당 득점 계산
	console.log "end of a game"
	console.log "ruler: #{rulers}"
	console.log scores
	oppositeScore = 0
	oppositeScore += scores[i] for i in [0..4] when not (i in rulers)
	rulerScore = 20 - oppositeScore
	console.log "#{rulerScore} #{oppositeScore} #{rule.currentPromise}"
	if rulerScore >= rule.currentPromise[1]
		# 여당 승리
		if rulerScore == 20 and rule.currentPromise[1] == 20
			console.log "예고 런으로 여당 승리!!!"
			everyone.now.notifyMsg "예고 런으로 여당 승리!!!"
			everyone.now.notifyVictory rule.Victory.WinByNoticedRun
		else if rulerScore == 20
			console.log "런으로 여당 승리!!!"
			everyone.now.notifyMsg "런으로 여당 승리!!!"
			everyone.now.notifyVictory rule.Victory.WinByRun
		else
			console.log "여당 승리!!!"
			everyone.now.notifyMsg "여당 승리!!!"
			everyone.now.notifyVictory rule.Victory.Win
	else
		# 야당 승리
		if oppositeScore >= 11
			# 백런
			console.log "백ㅋㅋㅋ런ㅋㅋㅋ"
			everyone.now.notifyMsg "백ㅋㅋㅋ런ㅋㅋㅋ"
			everyone.now.notifyVictory rule.Victory.LoseByBackRun
		else
			# 평범한 야당 승리
			console.log "야당 승리!"
			everyone.now.notifyMsg "야당 승리!"
			everyone.now.notifyVictory rule.Victory.Lose
	setTimeout(->
			changeState(everyone.now.VOTE)
		, 5000)

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

################################################################################
# Test
################################################################################

testFailFlag = false

assertFalse = (o, msg= '') ->
	if o
		console.log "AssertFalse fail: #{msg}"
		testFailFlag = true

assertTrue = (o, msg= '') ->
	if not o
		console.log "AssertTrue fail: #{msg}"
		testFailFlag = true

assertEqual = (l, r, msg = '') ->
	if l != r
		console.log "AssertEqual fail: #{msg}"
		console.log "expected: #{l}"
		console.log "actual: #{r}"
		testFailFlag = true

test = ->
	assertTrue rule.hasFace(['c3', 'jr'], 'c')
	assertTrue rule.checkDealMiss(['hq','h2','h3','h4','h5','h6','h7','h8','h9','jr'])
	assertTrue rule.checkDealMiss(['hq','h2','h3','h4','h5','h6','h7','h8','s1','jr'])
	assertFalse rule.checkDealMiss(['hq','h2','h3','h4','h5','h6','h7','c1','d1','jr'])

	setCards = (cards) ->
		rule.resetTrick()
		rule.addTrick(card) for card in cards

	setCards ['c3','c8','c1','dj','ck']
	rule.setPromise(['c', 14])
	assertEqual 2, rule.determineTurnWinner 0, 1
	rule.setPromise(['d', 14]) # giruda win
	assertEqual 3, rule.determineTurnWinner 0, 1
	assertEqual 3, rule.determineTurnWinner 0, 0

	setCards ['c3','c8','c1','jr','ck']
	rule.setPromise(['c', 14])
	assertEqual 3, rule.determineTurnWinner 0, 1
	rule.setPromise(['d', 14])
	assertEqual 3, rule.determineTurnWinner 0, 1
	assertEqual 2, rule.determineTurnWinner rule.ChooseCardOption.JokerCall, 1
	assertEqual 2, rule.determineTurnWinner 0, 9

	setCards ['c3','c8','jr','st','d1']
	rule.setPromise(['c', 14])
	assertEqual 2, rule.determineTurnWinner 0, 1
	assertEqual 1, rule.determineTurnWinner rule.ChooseCardOption.JokerCall, 1
	assertEqual 1, rule.determineTurnWinner 0, 9
	rule.setPromise(['d', 14])
	assertEqual 2, rule.determineTurnWinner 0, 1
	rule.setPromise(['s', 14])
	assertEqual 4, rule.determineTurnWinner 0, 1

	testValidChoice = (cards, hand, card, option, currentTurn) ->
		rule.resetTrick()
		rule.addTrick(c) for c in cards
		hand or= [card]
		rule.isValidChoice(hand, card, option, currentTurn)

	# 카드 내기 테스트
	rule.setPromise ['h', 14] # 제일 영향 안받게 기루는 하트로 해둠
	# 조커
	assertFalse testValidChoice([], null, 'jr', rule.ChooseCardOption.HCome, 0), "첫턴 조커"
	assertTrue testValidChoice([], null, 'jr', rule.ChooseCardOption.HCome, 1), "조커"
	assertFalse testValidChoice([], null, 'jr', rule.ChooseCardOption.None, 1), "조커"

	# 조커콜
	assertFalse testValidChoice([], null, 'c3', rule.ChooseCardOption.JokerCall, 0), "첫턴 조커콜 안됨"
	assertTrue testValidChoice([], null, 'c3', rule.ChooseCardOption.None, 0), "첫턴 조커콜 안됨"
	assertTrue testValidChoice(['c3'], ['jr', 'c2'], 'c2', rule.ChooseCardOption.None, 1), "조콜안했으면 딴거내도됨"
	assertFalse testValidChoice(['c3'], ['jr', 'c2', 's5'], 's5', rule.ChooseCardOption.None, 1), "조콜안했으면 딴거내도됨"
	assertTrue testValidChoice(['c3'], ['jr', 'c2'], 'jr', rule.ChooseCardOption.None, 1), "조콜안했으면 딴거내도됨"
	assertFalse testValidChoice(['c3'], ['jr', 'c2'], 'c2', rule.ChooseCardOption.JokerCall, 1), "조콜했으면 조커가 나와야지!"
	assertTrue testValidChoice(['c3'], ['jr', 'c2'], 'jr', rule.ChooseCardOption.JokerCall, 1), "조콜했으면 조커가 나와야지!"
	assertTrue testValidChoice(['c3'], ['jr', 'c2', 's1'], 's1', rule.ChooseCardOption.JokerCall, 1), "조콜했지만 간지나게 마이티"
	rule.setPromise ['s', 14]
	assertFalse testValidChoice(['c3'], ['jr', 'c2', 's1'], 's1', rule.ChooseCardOption.JokerCall, 1), "조콜했을때 마이티 였던 기아를 내는 경우"

	rule.setPromise ['h', 14]
	# 첫턴 기루 
	assertFalse testValidChoice([], null, 'h3', rule.ChooseCardOption.None, 0), "첫턴 기루 안됨"
	assertTrue testValidChoice(['d1'], null, 'h3', rule.ChooseCardOption.None, 0), "첫턴 간치기는 가능"

	if testFailFlag
		process.exit(1)
	else
		console.log 'All test OK'

test()

################################################################################
# Serving
################################################################################

port = 40037
server.listen port, "0.0.0.0"


console.log "Server running at http://0.0.0.0:#{port}/"

