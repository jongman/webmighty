if not exports?
	exports = this['rule'] = {}

exports.VALUE_ORDER = "23456789tjqk1"

# 승패는 주공 기준
exports.Victory =
	WinByNoticedRun: 1
	WinByRun: 2
	Win: 3
	Lose: 4
	LoseByBackRun: 5

exports.ChooseCardOption =
	None: 0
	JokerCall: 1
	SCome: 2
	DCome: 3
	HCome: 4
	CCome: 5

################################################################################
# Friend
################################################################################
exports.FriendOption =
	None: 0
	NoFriend: 1
	ByCard : 2
	FirstTrick: 3

exports.friendOption = exports.FriendOption.None
exports.friendKnown = false
exports.friendIndex = null
exports.friendHandler = ->

exports.setFriendHandler = (handler) ->
	exports.friendHandler = handler

exports.resetFriendOption = ->
	exports.friendOption = exports.FriendOption.None
	exports.friendKnown = false
	exports.friendIndex = null

exports.setFriend = (option, arg = null) ->
	exports.friendOption = option
	exports.friendKnown = option == exports.FriendOption.NoFriend
	exports.friendIndex = -1
	if option == exports.FriendOption.ByCard
		exports.friendCard = arg
	else
		exports.friendCard = null

exports.checkFriendCard = (index, card) ->
	if exports.friendOption == exports.FriendOption.ByCard and card == exports.friendCard
		exports.friendKnown = true
		exports.friendIndex = index
		exports.friendHandler(index)

exports.checkFriendEndTurn = (winnerIndex) ->
	if exports.friendOption == exports.FriendOption.FirstTrick and exports.currentTurn == 0
		exports.friendKnown = true
		exports.friendIndex = winnerIndex
		exports.friendHandler(winnerIndex)

exports.isFriendByHand = (hand) ->
	return exports.friendOption == exports.FriendOption.ByCard and exports.friendCard in hand

exports.isFriend = (index) ->
	return exports.friendKnown and index == exports.friendIndex
	
exports.isFriendKnown = () ->
	exports.friendKnown

################################################################################
# Trick (현재 턴에 나온 카드 관리)
################################################################################
exports.currentTrick = []
exports.currentTurn = 0

exports.addTrick = (card, index = null) ->
	exports.currentTrick.push(card)
	if index?
		exports.checkFriendCard(index, card)

exports.resetTrick = (winnerIndex = null) ->
	exports.currentTrick = []
	if winnerIndex?
		exports.checkFriendEndTurn winnerIndex
		exports.currentTurn += 1

exports.getCurrentTrickFace = (currentTrickOption) ->
	if exports.currentTrick.length == 0
		return 'n'
	if currentTrickOption == exports.ChooseCardOption.CCome
		return 'c'
	if currentTrickOption == exports.ChooseCardOption.HCome
		return 'h'
	if currentTrickOption == exports.ChooseCardOption.SCome
		return 's'
	if currentTrickOption == exports.ChooseCardOption.DCome
		return 'd'
	if exports.currentTrick[0] == 'jr'
		if exports.currentTrick.length > 1
			return exports.currentTrick[1][0]
		else
			return 'n'
	return exports.currentTrick[0][0]


################################################################################
# Promise
################################################################################

exports.currentPromise = null

exports.setPromise = (promise) ->
	exports.currentPromise = promise
	exports.currentTurn = 0

exports.resetPromise = ->
	exports.currentPromise = null

exports.getMightyCard = ->
	if exports.currentPromise? and exports.currentPromise[0] == 's'
		return 'd1'
	return 's1'

exports.getJokerCallCard = ->
	if exports.currentPromise? and exports.currentPromise[0] == 'c'
		return 's3'
		#return 'd3'
	return 'c3'

exports.hasFace = (cards, face) ->
	for card in cards
		if card[0] == face
			return true
	false

exports.isSameFace = (card, face) ->
	face == 'n' or card[0] == face

exports.isValidChoice = (hand, card, option, currentTurn) ->
	# TODO RULESET
	if hand.indexOf(card) == -1
		return false
	if exports.currentTrick.length == 0
		# first, can change option
		if option != exports.ChooseCardOption.None
			if option == exports.ChooseCardOption.JokerCall
				# 첫턴에 조커콜 안됨
				return card == exports.getJokerCallCard() and currentTurn != 0
			else if option in [exports.ChooseCardOption.SCome, exports.ChooseCardOption.DCome, exports.ChooseCardOption.HCome, exports.ChooseCardOption.CCome]
				# 특정 무늬 불렀으면 조커를 내야지!
				# 근데 막턴이나 첫턴은 안됨
				return card == 'jr' and currentTurn != 0 and currentTurn != 9
		else if card == 'jr'
			# 처음에 내는데 콜이 아닌 경우는 맨첨이나 마지막에 버리는 용도
			return exports.currentPromise == 0 or currentTurn == 9
		else if exports.currentPromise? and card[0] == exports.currentPromise[0] and currentTurn == 0 # 첫턴에 기루 안됨
			return false
	else
		if card == exports.getMightyCard()
			return true
		else if card == 'jr'
			return true
		else if (exports.hasFace hand, 'j') and option == exports.ChooseCardOption.JokerCall and card != 'jr'
			# 조커콜 당했는데 조커 안낸 경우
			return false
		else if exports.currentTrick.length > 0 and (exports.hasFace hand, exports.getCurrentTrickFace(option)) and not exports.isSameFace(card, exports.getCurrentTrickFace(option))
			# 선과 같은 무늬가 있는데 안 낸 경우
			return false
	true

exports.determineTurnWinner = (currentTrickOption, currentTurn) ->
	# TODO RULESET
	scores = [0, 0, 0, 0, 0]
	for i in [0...5]
		if exports.currentTrick[i] == exports.getMightyCard()
			return i
		else if exports.currentTrick[i] == 'jr'
			if currentTrickOption == exports.ChooseCardOption.JokerCall or currentTurn == 0 or currentTurn == 9
				scores[i] = 0
			else
				scores[i] = 1000
		else if exports.currentTrick[i][0] == exports.currentPromise[0] # giruda
			scores[i] = 200 + exports.VALUE_ORDER.indexOf exports.currentTrick[i][1]
		else if exports.currentTrick[i][0] == exports.getCurrentTrickFace(currentTrickOption) # same
			scores[i] = 100 + exports.VALUE_ORDER.indexOf exports.currentTrick[i][1]
		else
			scores[i] = 0

	maxScoreIndex = 0
	for i in [1...5]
		if scores[i] > scores[maxScoreIndex]
			maxScoreIndex = i

	#console.log 'trick result'
	#console.log exports.currentTrick
	#console.log scores
	return maxScoreIndex

exports.checkDealMiss = (cards) ->
	# TODO implement deal miss options
	# TODO RULESET
	score = 0
	for card in cards
		if card[1] in ['1','j','k','q']
			if card == exports.getMightyCard()
				# mighty
				score += 0
			else
				score += 1
		else if card[1] == 't'
			score += 0.5
		else if card[0] == 'j'
			score -= 1
	return score < 1

exports.resetGame = ->
	exports.resetFriendOption()
	exports.resetPromise()

################################################################################
# Encode/Decode for restoring
################################################################################
exports.encodeState = ->
	return [
		exports.currentTrick,
		exports.currentTurn,
		exports.friendOption,
		exports.friendKnown,
		exports.friendIndex,
		exports.currentPromise]

exports.decodeState = (o) ->
	[ exports.currentTrick,
		exports.currentTurn,
		exports.friendOption,
		exports.friendKnown,
		exports.friendIndex,
		exports.currentPromise] = o
