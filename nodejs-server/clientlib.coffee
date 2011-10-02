window.LIBGAME = 1
allowGuestPlay = false

assertTrue = (o, msg="") ->
	if not o
		alert "AssertTrue fail: #{msg}"
		testFailFlag = true

assertEqual = (e, a, msg="") ->
	if e != a
		alert "AssertEqual fail: expected #{e}, actual #{a}; #{msg}"
		testFailFlag = true

test = ->
	assertTrue rule.hasFace(['c3', 'jr'], 'c')

test()

systemMsg = (msg) ->
	$('#log').html(
		(index, oldHtml) ->
			oldHtml + '<BR>' + msg
		)

################################################################################
# Global variable
################################################################################
VALUE_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "잭", "퀸", "킹", "에이스"]
SUIT_NAMES =
	s: "스페이드"
	h: "하트"
	c: "클로버"
	d: "다이아몬드"
	n: "노기루다"
name2index = {}
client2index = {}
myIndex = 0
users = {}
jugongIndex = -1

################################################################################
# Helper functions
################################################################################

FACE_ORDER = (giruda_ = null) ->
	if rule.currentPromise?
		giruda_ ?= rule.currentPromise[0]
	giruda_ ?= 'n'
	if giruda_ == 's'
		return "jsdch"
	if giruda_ == 'd'
		return "jdsch"
	if giruda_ == 'c'
		return "jcsdh"
	if giruda_ == 'h'
		return "jhsdc"
	return "jsdch"

VALUE_ORDER = "23456789tjqk1"

getRelativeIndexFromIndex = (idx) ->
	return (idx - myIndex + 5) % 5

getIndexFromRelativeIndex = (ridx) ->
	return (myIndex + ridx) % 5

isJugong = (index=null) ->
	if now.observer and not index?
		return false
	index ?= myIndex
	return index == jugongIndex

################################################################################
# Event handling
################################################################################
channel_max = 10
audiochannels = []
for a in [0...channel_max]
	audiochannels[a] = []
	audiochannels[a]['channel'] = new Audio()
	audiochannels[a]['finished'] = -1

playSound = (soundName) ->
	thistime = new Date()
	elem = $("#sounds ." + soundName).get(0)
	if elem.muted
		return
	for a in [0...channel_max]
		if audiochannels[a]['finished'] < thistime.getTime()
			audiochannels[a]['finished'] = thistime.getTime() + elem.duration*1000
			audiochannels[a]['channel'].src = elem.src
			audiochannels[a]['channel'].load()
			audiochannels[a]['channel'].play()
			break

lastSuit = null
doCommitment = ->
	now.notfyImTakingAction()
	playSound "myturn"
	systemMsg "공약 내세우기"

	if rule.currentPromise?
		minNoGiru = minOthers = rule.currentPromise[1]+1
	else
		minNoGiru = 13
		minOthers = 14

	canDealMiss = rule.checkDealMiss (card.face for card in window.field.hands[0])
	if lastSuit?
		defaultSuit = lastSuit
	else
		scores = 
			h: 0
			s: 0
			d: 0
			c: 0
		for card in window.field.hands[0]
			if card.face[0] == 'j'
				continue

			score = 0
			if card.face[1] in '23456789'
				score = 1
			else if card.face[1] in 'tjq'
				score = 1.5
			else if card.face[1] in 'k1'
				score = 2

			scores[card.face[0]] += score

		currentScore = scores.h
		defaultSuit = 'h'
		if scores.c > currentScore
			defaultSuit = 'c'
			currentScore = scores.c
		if scores.d > currentScore
			defaultSuit = 'd'
			currentScore = scores.d
		if scores.s > currentScore
			defaultSuit = 's'
			currentScore = scores.s

	defaultValue = minOthers

	window.field.choosePromise(minNoGiru, minOthers, canDealMiss, defaultSuit, defaultValue,
		(res) ->
			console.log(res)
			if res.result == "pass"
				now.commitmentPass()
			else if res.result == "dealmiss"
				now.commitmentDealMiss()
			else
				now.commitmentAnnounce(res.suit, res.value)
				lastSuit = res.suit
	)

commitmentIndex = 0
checkForCommitment = ->
	commitmentIndex += 1
	if commitmentIndex >= 2
		setTimeout(
			->
				doCommitment()
			, 300)

now.requestCommitment = ->
	checkForCommitment()

now.notifyCards = (allCards) ->
	# observer method
	cards = [
		allCards[ 0...10],
		allCards[10...20],
		allCards[20...30],
		allCards[30...40],
		allCards[40...50]]
	window.field.globalMessage("선거가 시작됩니다!")
	window.field.deal(cards, 1, ->)

now.receiveDealtCards = (cards) ->
	commitmentIndex = 0
	CARDS = [
		cards
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]]
	window.field.globalMessage("선거가 시작됩니다!")
	window.field.deal CARDS, 1, -> 
		checkForCommitment()

# 주공 당선 후 손 정리

now.requestRearrangeHand = (additionalCards) ->
	now.notfyImTakingAction()
	window.field.dealAdditionalCards(additionalCards, 0, ->
			# TODO 여기서 공약 변경도 동시에 이루어짐
			window.field.globalMessage("교체할 3장의 카드를 골라주세요.")
			window.field.chooseMultipleCards(3,
				(chosen) ->
					# 현재는 이전 공약 그대로
					now.rearrangeHand (card.face for card in chosen), rule.currentPromise[0], rule.currentPromise[1]
					window.field.takeCards(0, chosen,
						->
							window.field.hands[0].remove(card) for card in chosen
							window.field.repositionCards(0)
							assertEqual 10, window.field.hands[0].length
						)
			)
	)

now.notifyRearrangeHandDone = (cards = null)->
	if isJugong()
		return
	jugongRIndex = getRelativeIndexFromIndex jugongIndex
	chosen = window.field.hands[jugongRIndex]
	chosen = [chosen[0], chosen[1], chosen[2]]

	if cards?
		# 옵저버인 경우 카드 정보가 담겨옴
		chosen = []
		for c in window.field.hands[jugongRIndex]
			if c.face in cards
				chosen.push(c)

	window.field.takeCards(jugongRIndex, chosen,
		->
			window.field.hands[jugongRIndex].remove(card) for card in chosen
			window.field.repositionCards(jugongRIndex)
		)

now.notifyRearrangeHand = (cards = ['back','back','back']) ->
	if isJugong()
		return
	window.field.dealAdditionalCards(cards, getRelativeIndexFromIndex jugongIndex,
		->
			window.field.globalMessage("#{users[jugongIndex].name} 님이 당을 재정비하고 있습니다.")
	)

# 프렌드 선택
now.requestChooseFriend = ->
	window.field.prompt '프렌드 선택 (예: nofriend firsttrick joker mighty ca d10 hk s3)', null, (x)->
		if x == 'nofriend'
			now.chooseFriendNone()
		else if x == 'joker'
			now.chooseFriendByCard('jr')
		else if x == 'mighty'
			now.chooseFriendByCard(rule.getMightyCard())
		else if x == 'firsttrick'
			now.chooseFriendFirstTrick()
		else if x[0] in 'hcsd' and x.length == 2 and x[1] in '123456789tjkqa'
			if x[1] == 'a'
				x = x[0] + '1'
			now.chooseFriendByCard(x)
		else if x[0] in 'hcsd' and x.length == 3 and x[1] == '1' and x[2] == '0'
			now.chooseFriendByCard(x[0]+'t')
		else
			now.requestChooseFriend()
	
now.notifyChooseFriend = ->
	if not isJugong()
		window.field.globalMessage("#{users[jugongIndex].name} 님이 함께할 프렌드를 선택하고 있습니다.")

renderFaceName = (face) ->
	if face == rule.getMightyCard()
		return "마이티"
	if face == 'jr'
		return "조커"
	suit = SUIT_NAMES[face[0]]
	if face[0] == rule.currentPromise[0]
		suit = "기루다"
	value = VALUE_NAMES[VALUE_ORDER.indexOf(face[1])]
	return "#{suit} #{value}"

friendHandler = (index) ->
	window.field.setPlayerType getRelativeIndexFromIndex(index), "프렌드"
	window.field.removeCollectedCards getRelativeIndexFromIndex(index)
	systemMsg "friend is " + users[index].name

rule.setFriendHandler friendHandler

setFriendTitle = ->
	if rule.friendOption == rule.FriendOption.ByCard
		cardName = renderFaceName rule.friendCard
		document.title = buildCommitmentString(rule.currentPromise...) + ', ' + cardName + '프렌드'
	else if rule.friendOption == rule.FriendOption.NoFriend
		document.title = buildCommitmentString(rule.currentPromise...) + ', ' + '프렌드 없음'
	else if rule.friendOption == rule.FriendOption.FirstTrick
		document.title = buildCommitmentString(rule.currentPromise...) + ', ' + '초구 프렌드'
	else
		document.title = buildCommitmentString(rule.currentPromise...)

now.notifyFriendByCard = (card) ->
	cardName = renderFaceName card
	rule.setFriend rule.FriendOption.ByCard, card
	setFriendTitle()
	if (rule.isFriendByHand(c.face for c in window.field.hands[0])) and not isJugong()
		window.field.setPlayerType 0, "(프렌드)"

now.notifyFriendNone = ->
	rule.setFriend rule.FriendOption.NoFriend
	setFriendTitle()

now.notifyFriendFirstTrick = ->
	rule.setFriend rule.FriendOption.FirstTrick
	setFriendTitle()

# 카드 내기

now.requestChooseCard = (currentTurn, option, fromServer = true) ->
	if fromServer
		now.notfyImTakingAction()
	if fromServer
		playSound "myturn"
	player = 0
	handFace = (c.face for c in window.field.hands[player])
	filter = (card) ->
		if card.face == 'jr'
			# 실제로 조커는 option을 붙여서 내야하므로 isValidChoice가 fail함
			# 카드 고르는 시점에선 조커는 낼 수 있음
			return true
		rule.isValidChoice(handFace, card.face, option, currentTurn)

	window.field.chooseFilteredCard(filter, (card) ->
		dontDo = false
		if rule.currentTrick.length == 0
			if card.face == 'jr' 
				if currentTurn != 0 and currentTurn != 9
					# 조커 선때 무늬 고르기
					# 클로져 만들려고 일단 변수 선언
					chooseSuit = null
					chooseSuit = ->
						window.field.prompt "무늬를 선택해주세요(s/d/c/h/g:기루)", null, (suit) ->
							option = null
							if suit[0] == 'g'
								suit = rule.currentPromise[0]

							if suit[0] == 's'
								option = rule.ChooseCardOption.SCome
							else if suit[0] == 'd'
								option = rule.ChooseCardOption.DCome
							else if suit[0] == 'c'
								option = rule.ChooseCardOption.CCome
							else if suit[0] == 'h'
								option = rule.ChooseCardOption.HCome

							if option?
								now.chooseCard card.face, option
							else
								chooseSuit()

					chooseSuit()
					dontDo = true

				else if currentTurn == 0
					window.field.prompt "첫턴에 조커는 아무런 효력이 없습니다. 그래도 내시겠습니까? (yes / no)", "n", (answer) ->
						if answer[0] == 'y'
							now.chooseCard card.face, option
						else
							dontDo = true
							now.requestChooseCard(currentTurn, option, false)
			else if card.face == rule.getJokerCallCard() and currentTurn != 0
				# 조커콜 할까요 말까요
				dontDo = true
				window.field.prompt "조커콜 하나요? (yes / no)", 'y', (doJokerCall) ->
					if doJokerCall[0] == 'y'
						option = rule.ChooseCardOption.JokerCall
					else
						option = rule.ChooseCardOption.None
					now.chooseCard card.face, option
		else
			if currentTurn == 0 and card.face == 'jr'
				dontDo = true
				window.field.prompt "첫턴에 조커는 아무런 효력이 없습니다. 그래도 내시겠습니까? (yes / no)", "n", (answer) ->
					if answer[0] == 'y'
						now.chooseCard card.face, option
					else
						dontDo = true
						now.requestChooseCard(currentTurn, option, false)

		if not dontDo
			now.chooseCard card.face, option
	)

now.notifyPlayCard = (index, card, option) ->

	optionStr = null

	if rule.currentTrick.length == 0
		if option == rule.ChooseCardOption.JokerCall
			playSound "jokercall"
			optionStr = "조커 콜!"
		else if option in [rule.ChooseCardOption.HCome, rule.ChooseCardOption.SCome, rule.ChooseCardOption.DCome, rule.ChooseCardOption.CCome]
			playSound "playjoker"
			optionStr = "기루다 컴!"
			if option == rule.ChooseCardOption.HCome and rule.currentPromise[0] != 'h'
				optionStr = "하트 컴!"
			else if option == rule.ChooseCardOption.DCome and rule.currentPromise[0] != 'd'
				optionStr = "다이아몬드 컴!"
			else if option == rule.ChooseCardOption.SCome and rule.currentPromise[0] != 's'
				optionStr = "스페이드 컴!"
			else if option == rule.ChooseCardOption.CCome and rule.currentPromise[0] != 'c'
				optionStr = "클로버 컴!"

	if not optionStr?
		optionStr = renderFaceName card
		if rule.currentTrick.length != 0 and card[0] == rule.currentPromise[0] and (rule.currentTurn == 0 or rule.currentTurn == 9 or option in [rule.ChooseCardOption.None,rule.ChooseCardOption.JokerCall]) and rule.getCurrentTrickFace(option) != card[0] and rule.currentTrick[0] != rule.getMightyCard()
			playSound "gan"
		else
			playSound "playcard"

	window.field.playCard (getRelativeIndexFromIndex index), card, optionStr
	rule.addTrick(card, index)

now.takeTrick = (currentTurn, winnerIndex) ->
	window.field.endTurn((getRelativeIndexFromIndex winnerIndex), not (isJugong(winnerIndex) or rule.isFriend(winnerIndex) and rule.isFriendKnown()))
	rule.resetTrick(winnerIndex)

################################################################################
# Notify
################################################################################

class NetworkUser
	constructor: (@name, @index, @image) ->
		name2index[@name] = @index

buildCommitmentString = (face, target) ->
	suit = SUIT_NAMES[face]
	return "#{suit} #{target}"

now.notifyJugong = (finalJugongIndex, face, target) ->
	jugongIndex = finalJugongIndex
	systemMsg "jugong is #{users[jugongIndex].name}"
	rule.setPromise([face, target])
	
	document.title = buildCommitmentString(face, target)

	if now.state == now.VOTE
		window.field.setPlayerType (getRelativeIndexFromIndex jugongIndex), "주공"
		window.field.playerMessage (getRelativeIndexFromIndex jugongIndex), "당선", buildCommitmentString(face, target)

		if isJugong()
			window.field.globalMessage "당선 축하드립니다!"
		else
			name = users[jugongIndex].name
			window.field.globalMessage "#{name} 님이 당선되었습니다!"

	else if now.state == now.REARRANGE_HAND
		# 주공이 포기하고 무늬 바꾼거
		newPromise = buildCommitmentString face, target
		window.field.globalMessage "공약이 변경되었습니다: #{newPromise}"

now.resetRule = ->
	rule.resetGame()

now.notifyChangeState = (newState) ->
	systemMsg 'changeState to ' + newState
	if newState != now.WAITING_PLAYER
		window.field.hidePlayerList()
	if newState == now.WAITING_PLAYER
		window.field.setPlayers([])
		window.field.showPlayerList()
		#$("#logwin").find("button").unbind().removeAttr("disabled")
	if newState == now.VOTE
		document.title = "새 게임을 시작합니다."
		commitmentIndex = 0
		rule.resetGame()
		window.field.setPlayers(
			{name: users[getIndexFromRelativeIndex(ridx)].name , picture: (if users[getIndexFromRelativeIndex(ridx)].image == "" then "static/guest.png" else users[getIndexFromRelativeIndex(ridx)].image)} for ridx in [0...5]
		)

	#else if newState == now.END_GAME
		#name2index = {}
		#client2index = {}
		#users = {}

now.notifyPlayers = (infos) ->
	users = {}
	window.field.clearPlayerList()
	for i in [0...5]
		if i >= infos.length
			break
		name = infos[i][0]
		image = ""
		image = infos[i][1]
		index = i
		# TODO profile image
		if name != ""
			users[index] = new NetworkUser(name, index, image)
			window.field.addPlayerToList index, name, image
		else
			window.field.removePlayerFromList index

	if now.state == now.WAITING_PLAYER
		window.field.showPlayerList()

now.notifyMsg = (msg) ->
	if window.field?
		window.field.globalMessage msg
	document.title = msg

now.notifyVote = (index, face, target) ->
	rule.setPromise([face, target])
	window.field.playerMessage((getRelativeIndexFromIndex index), "공약", buildCommitmentString(face, target))

now.notifyDealMiss = (index, hand) ->
	window.field.playerMessage((getRelativeIndexFromIndex index), "딜미스")
	# TODO show dealmiss hand

now.notifyPass = (index) ->
	window.field.playerMessage((getRelativeIndexFromIndex index), "패스")

now.notifyVictory = (victoryFlag) ->
	isIAmOnRuler = isJugong() or rule.isFriend(myIndex)
	isMyWin = null
	if victoryFlag in [rule.Victory.LoseByBackRun, rule.Victory.Lose]
		isMywin = not isIAmOnRuler
	else
		isMywin = isIAmOnRuler
	
	if isMywin
		playSound "win"
		if victoryFlag in [rule.Victory.LoseByBackRun, rule.Victory.WinByRun, rule.Victory.WinByNoticedRun]
			playSound "clap"
	else
		playSound "lose"

now.notifyReady = (clientId, index, playerInfos) ->
	if clientId == now.core.clientId
		myIndex = index
	systemMsg "players: " + playerInfos
	# TODO receive profile image src
	window.field.addPlayerToList index, playerInfos[index][0], playerInfos[index][1]
	window.field.showPlayerList()

now.notifyObserver = (encodedRule, cards, collectedCards, currentTrickStartIndex, jugongIndex_) ->
	myIndex = 0
	now.resetField()
	jugongIndex = jugongIndex_
	window.field.setPlayers(
		{name: users[getIndexFromRelativeIndex(ridx)].name , picture: (if users[getIndexFromRelativeIndex(ridx)].image == "" then "static/guest.png" else users[getIndexFromRelativeIndex(ridx)].image)} for ridx in [0...5]
		)
	window.field.collected = [[],[],[],[],[]]
	rule.decodeState encodedRule
	window.field.playedCards = window.field.createCardsFromFace rule.currentTrick

	if jugongIndex? and (now.state in [ now.VOTE_KILL, now.REARRANGE_HAND, now.CHOOSE_FRIEND, now.TAKE_TURN])
		window.field.setPlayerType (getRelativeIndexFromIndex jugongIndex), "주공"

	if now.state == now.TAKE_TURN
		# 게임 진행중인 경우
		if rule.isFriendKnown()
			window.field.setPlayerType getRelativeIndexFromIndex(rule.friendIndex), "프렌드"

	for i in [0...window.field.playedCards.length]
		card = window.field.playedCards[i]
		window.field.moveToPlayedPosition(i+currentTrickStartIndex, card)

	window.field.hands = []
	for i in [0...5]
		hand = window.field.createCardsFromFace cards[i], i

		window.field.hands.push hand
		if isJugong(i) or rule.isFriend(i)
		else
			window.field.collectCards i, (window.field.createCardsFromFace collectedCards[i], i)
		window.field.repositionCards(i)
		window.field.sortHands(i)
	
	if now.state != now.VOTE and now.state != now.WAITING_PLAYER
		setFriendTitle()

now.resetField = ->
	window.field.clearCards()
################################################################################
# Miscellaneous
################################################################################

now.notifyInAction = (index) ->
	# TODO display player[index] is currently taking action

now.showName = ->
	systemMsg "i am #{@now.name}"

# (TEST only) set ready when page load
readyCount = 0
onAllReady = ->
	now.fbUserID = null

	fbHandler = (response)->
		$("#oneliner").text("")
		if response.status == "connected" and response.authResponse?
			window.fbAccessToken = response.authResponse.accessToken
			now.image = "http://graph.facebook.com/" + response.authResponse.userID + "/picture"
			FB.api('/me', (user)->
				if user?
					#image = document.getElementById('image');
					#image.src = 'http://graph.facebook.com/' + user.id + '/picture';
					now.name = user.name
					now.fbUserID = user.id
			)
		else
			now.image = ""
			now.fbUserID = null
			if not allowGuestPlay
				$("#oneliner").text("플레이하기 위해선 페이스북 로그인이 필요합니다.")

	FB.getLoginStatus fbHandler
	FB.Event.subscribe("auth.authResponseChange", fbHandler)
	FB.Event.subscribe("auth.statusChange", fbHandler)

	window.field.setPlayerListHandler(->
		if now.name.substr(0,6) == "player"
			window.field.prompt("What's your name?", now.name, (n)->
				if n == ""
					return
				now.name = n
				now.readyGame()
			)
		else
			now.readyGame()
	)

	if now.state == now.WAITING_PLAYER
		window.field.showPlayerList()
	$("#logwin").find("button").click(->

		if now.name.substr(0,6) == "player"
			window.field.prompt("What's your name?", now.name, (n)->
				if n == ""
					return
				now.name = n
				now.readyGame()
			)
		else
			now.readyGame()
	)

$(document).ready ->
	$("button.prompt").unbind("click").click(->
		playSound "playcard"
	)
	readyCount += 1
	if readyCount == 2
		onAllReady()
		
now.ready ->
	readyCount += 1
	if readyCount == 2
		onAllReady()

now.setAllowGuestPlay = (bool) ->
	allowGuestPlay = bool
	if allowGuestPlay
		$("#oneliner").text("")

loctable = {
	en: {
		패스: 'Pass'
	}
}

lang = 'ko'

getLocalizedString = (lang, word) ->
	if lang == 'ko'
		return word
	if lang in loctable and word in loctable[lang]
		return loctable[lang][word]
	else
		console.log "not localizable word #{word} for language #{lang}"
		return word
