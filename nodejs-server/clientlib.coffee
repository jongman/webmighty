window.LIBGAME = 1
#now.name = prompt("What's your name?", "")
systemMsg = (msg) ->
	$('#log').html( 
		(index, oldHtml) ->
			oldHtml + '<BR>' + msg
		)

################################################################################
# Global variable
################################################################################
giruda = 'n'
name2index = {}
client2index = {}
myIndex = 0
users = {}

################################################################################
# Helper functions
################################################################################

FACE_ORDER = (giruda_ = null) ->
	giruda_ or= giruda
	if giruda_ == 's'
		return "jsdch"
	if giruda_ == 'd'
		return "jdsch"
	if giruda_ == 'c'
		return "jcsdh"
	if giruda_ == 'h'
		return "jhsdc"
	return "jsdch"

VALUE_ORDER = -> "23456789tjqk1"

getRelativeIndexFromClientId = (clientId) ->
	return (client2index[clientId] - myIndex + 5) % 5

getRelativeIndexFromIndex = (idx) ->
	return (idx - myIndex + 5) % 5
getIndexFromRelativeIndex = (ridx) ->
	return (myIndex + ridx) % 5

################################################################################
# Event handling
################################################################################

doCommitment = ->
	systemMsg "공약 내세우기"
	x = prompt('공약 써주세요 (예: n14 s15 pass dealmiss)');
	if x == 'pass'
		now.commitmentPass()
	else if x == 'dealmiss'
		now.commitmentDealMiss()
	else 
		now.commitmentAnnounce x[0], parseInt(x.substr(1))

commitmentIndex = 0
checkForCommitment = ->
	commitmentIndex += 1
	if commitmentIndex == 2
		setTimeout (-> doCommitment(), 2000)

now.requestCommitment = ->
	checkForCommitment()

now.receiveDealtCards = (cards) ->
	startIndex = getRelativeIndexFromIndex now.lastFriendIndex
	CARDS = [
		cards
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]]
	window.field.deal CARDS, 1, -> checkForCommitment()
################################################################################
# Miscellaneous
################################################################################

class NetworkUser
	constructor: (@clientId, @name, @index) ->
		client2index[@clientId] = index

now.notifyChangeState = (newState) ->
	systemMsg '여기 왜 안불림요' + newState + now.VOTE
	if newState == now.VOTE
		commitmentIndex = 0
		window.field.setPlayers(
			{name: users[getIndexFromRelativeIndex(ridx)].name , picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/49218_593417379_9696_q.jpg"} for ridx in [0...5]
			)

	else if newState == now.END_GAME
		name2index = {}
		client2index = {}
		users = {}

now.notifyPlayers = (clientIds, names) ->
	for i in [0...5]
		clientId = clientIds[i]
		name = names[i]
		index = i
		users[index] = new NetworkUser(clientId, name, index)
		name2index[name] = index
		client2index[clientId] = index

now.notifyReady = (clientId, name, index) ->
	systemMsg name + " ready"
	name2index[name] = index
	client2index[clientId] = index
	users[index] = new NetworkUser(clientId, name, index)
	if clientId == now.core.clientId
		myIndex = index

now.showName = ->
	systemMsg 'i am ' + @now.name

# (TEST only) set ready when page load
now.ready ->
	now.readyGame()
