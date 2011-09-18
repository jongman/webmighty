window.LIBGAME = 1

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

#now.name = prompt("What's your name?", "")
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
	giruda_ or= rule.currentPromise[0]
	giruda_ or= 'n'
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

getRelativeIndexFromClientId = (clientId) ->
	return (client2index[clientId] - myIndex + 5) % 5

getRelativeIndexFromIndex = (idx) ->
	return (idx - myIndex + 5) % 5

getIndexFromRelativeIndex = (ridx) ->
	return (myIndex + ridx) % 5

isJugong = (index=null) ->
	index or= myIndex
	return index == jugongIndex

isFriend = (index=null) ->
	# TODO implement
	index or= myIndex
	return false

isFriendKnown = (index=null) ->
	# TODO implement
	index or= myIndex
	return false

################################################################################
# Event handling
################################################################################

doCommitment = ->
	systemMsg "공약 내세우기"
	while 1
		x = prompt('공약 써주세요 (예: n14 s15 pass dealmiss)');
		if x == 'pass'
			now.commitmentPass()
		else if x == 'dealmiss'
			now.commitmentDealMiss()
		else if x[0] in ['h','c','n','s','d'] and x.length <= 3 and x[1] in ['1','2']
			count = parseInt(x.substr(1))
			if count >= 12 and count <= 20
				now.commitmentAnnounce x[0], count
			else
				continue
		else
			continue
		break

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
		systemMsg window.field.cardStack

# 주공 당선 후 손 정리

now.requestRearrangeHand = (additionalCards) ->
	systemMsg additionalCards
	systemMsg window.field.cardStack
	systemMsg window.field.cardStack.length
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

now.notifyRearrangeHandDone = ->
	if isJugong()
		return
	console.log 'notifyRearrangeHandDone'
	jugongRIndex = getRelativeIndexFromIndex jugongIndex
	chosen = window.field.hands[jugongRIndex]
	chosen = [chosen[0], chosen[1], chosen[2]]

	window.field.takeCards(jugongRIndex, chosen,
		->
			window.field.hands[jugongRIndex].remove(card) for card in chosen
			window.field.repositionCards(jugongRIndex)
		)

now.notifyRearrangeHand = ->
	if isJugong()
		return
	systemMsg window.field.cardStack
	systemMsg window.field.cardStack.length
	window.field.dealAdditionalCards(['back','back','back'], getRelativeIndexFromIndex jugongIndex,
		->
			window.field.globalMessage("#{users[jugongIndex].name} 님이 당을 재정비하고 있습니다.")
	)

# 프렌드 선택
now.requestChooseFriend = ->
	systemMsg "프렌 선택"
	while 1
		x = prompt('프렌드 선택 (예: nofriend firsttrick joker mighty ca d10 hk s3)')
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
			continue
		break
	
now.notifyChooseFriend = ->
	if isJugong()
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
	systemMsg "friend is " + index

rule.setFriendHandler friendHandler

now.notifyFriendByCard = (card) ->
	cardName = renderFaceName card
	document.title = buildCommitmentString(rule.currentPromise...) + ', ' + cardName + '프렌드'
	rule.setFriend rule.FriendOption.ByCard, card
	systemMsg "friend is " + card + ' ' + cardName
	if rule.isFriendByHand window.field.hands[0] and not isJugong()
		window.field.setPlayerType 0, "프렌드"

now.notifyFriendNone = ->
	document.title = buildCommitmentString(rule.currentPromise...) + ', ' + '프렌드 없음'
	rule.setFriend rule.FriendOption.NoFriend
	systemMsg "no friend"

now.notifyFriendFirstTrick = ->
	document.title = buildCommitmentString(face, target) + ', ' + '초구 프렌드'
	rule.setFriend rule.FriendOption.FirstTrick
	systemMsg "first trick friend"

# 카드 내기

now.requestChooseCard = (currentTurn, option) ->
	player = 0
	handFace = (c.face for c in window.field.hands[player])
	filter = (card) ->
		if card.face == 'jr'
			# 실제로 조커는 option을 붙여서 내야하므로 isValidChoice가 fail함
			# 카드 고르는 시점에선 조커는 낼 수 있음
			return true
		rule.isValidChoice(handFace, card.face, option, currentTurn)

	systemMsg rule.currentTrick

	window.field.chooseFilteredCard(filter, (card) ->
		dontDo = false
		if rule.currentTrick.length == 0
			if card.face == 'jr' 
				if currentTurn != 0 and currentTurn != 9
					# 조커 선때 무늬 고르기
					while 1
						suit = prompt("무늬를 선택해주세요(s/d/c/h/g:기루)")
						if suit[0] == 's'
							option = rule.ChooseCardOption.SCome
						else if suit[0] == 'd'
							option = rule.ChooseCardOption.DCome
						else if suit[0] == 'c'
							option = rule.ChooseCardOption.CCome
						else if suit[0] == 'h'
							option = rule.ChooseCardOption.HCome
						else
							continue
						break
				else if currentTurn == 0
					answer = prompt("첫턴에 조커는 아무런 효력이 없습니다. 그래도 내시겠습니까? (yes / no)", "n")
					if answer[0] == 'y'
						# 그냥 냄 (따로 코드 필요없음)
					else
						dontDo = true
						now.requestChooseCard(currentTurn, option)
			else if card.face == rule.getJokerCallCard() and currentTurn != 0
				# 조커콜 할까요 말까요
				doJokerCall = prompt("조커콜 하나요? (yes / no)")
				if doJokerCall[0] == 'y'
					option = rule.ChooseCardOption.JokerCall
		else
			if currentTurn == 0 and card.face == 'jr'
				answer = prompt("첫턴에 조커는 아무런 효력이 없습니다. 그래도 내시겠습니까? (yes / no)", "n")
				if answer[0] == 'y'
					# 그냥 냄 (따로 코드 필요없음)
				else
					dontDo = true
					now.requestChooseCard(currentTurn, option)

		if not dontDo
			now.chooseCard card.face, option
	)

now.notifyPlayCard = (index, card, option) ->

	optionStr = null

	if rule.currentTrick.length == 0
		if option == rule.ChooseCardOption.JokerCall
			optionStr = "조커 콜!"
		else if option in [rule.ChooseCardOption.HCome, rule.ChooseCardOption.SCome, rule.ChooseCardOption.DCome, rule.ChooseCardOption.CCome]
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

	window.field.playCard (getRelativeIndexFromIndex index), card, optionStr
	rule.addTrick(card, index)

now.takeTrick = (currentTurn, winnerIndex) ->
	window.field.endTurn((getRelativeIndexFromIndex winnerIndex), not (isJugong(winnerIndex) or rule.isFriend(winnerIndex) and rule.isFriendKnown()))
	rule.resetTrick(winnerIndex)

################################################################################
# Notify
################################################################################

class NetworkUser
	constructor: (@clientId, @name, @index) ->
		client2index[@clientId] = @index
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

now.notifyChangeState = (newState) ->
	systemMsg 'changeState to ' + newState
	if newState == now.VOTE
		document.title = "새 게임을 시작합니다."
		commitmentIndex = 0
		rule.resetGame()
		window.field.setPlayers(
			{name: users[getIndexFromRelativeIndex(ridx)].name , picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/49218_593417379_9696_q.jpg"} for ridx in [0...5]
			)

	#else if newState == now.END_GAME
		#name2index = {}
		#client2index = {}
		#users = {}

now.notifyPlayers = (clientIds, names) ->
	for i in [0...5]
		clientId = clientIds[i]
		name = names[i]
		index = i
		users[index] = new NetworkUser(clientId, name, index)

now.notifyMsg = (msg) ->
	window.field.globalMessage msg
	document.title = msg

now.notifyVote = (index, face, target) ->
	rule.setPromise([face, target])
	systemMsg buildCommitmentString(face, target)
	window.field.playerMessage((getRelativeIndexFromIndex index), "공약", buildCommitmentString(face, target))

now.notifyDealMiss = (index) ->
	window.field.playerMessage((getRelativeIndexFromIndex index), "딜미스")

now.notifyPass = (index) ->
	window.field.playerMessage((getRelativeIndexFromIndex index), "패스")

now.notifyVictory = (victoryFlag) ->
	
now.notifyReady = (clientId, name, index) ->
	systemMsg name + " ready"
	name2index[name] = index
	client2index[clientId] = index
	users[index] = new NetworkUser(clientId, name, index)
	if clientId == now.core.clientId
		myIndex = index

################################################################################
# Miscellaneous
################################################################################

now.showName = ->
	systemMsg "i am #{@now.name}"

# (TEST only) set ready when page load
readyCount = 0
$(document).ready ->
	readyCount += 1
	if readyCount == 2
		now.readyGame()
now.ready ->
	readyCount += 1
	if readyCount == 2
		now.readyGame()

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
