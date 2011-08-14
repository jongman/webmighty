
# CONSTANTS
PROFILE_WIDTH = 250
PROFILE_CARD_GAP = 15
CARD_WIDTH = 71
CARD_HEIGHT = 96
CARD_OVERLAP = 20
SPEED_BASE = 50
PI = Math.PI
PLAYED_CARD_RADIUS = 60
PLAYER_LOCATION =
	5: [
		{ side: "bottom", location: 0.5, angle: PI * (3 / 2)}
		{ side: "left", location: 0.6, angle: PI * (3 / 2 - 2 / 5) }
		{ side: "top", location: 0.25, angle: PI * (3 / 2 - 4 / 5) }
		{ side: "top", location: 0.75, angle: PI * (3 / 2 - 6 / 5) }
		{ side: "right", location: 0.6, angle: PI * (3 / 2 - 8 / 5) }
	]
DISAPPEAR_DIRECTION =
	left: [-CARD_HEIGHT, 0]
	right: [CARD_HEIGHT, 0]
	top: [0, -CARD_HEIGHT]
	bottom: [0, CARD_HEIGHT]

SCORE_CARD_VALUES = "tjqk1"
VALUE_ORDER = "23456789tjqk1"
SUIT_NAMES =
	s: "스페이드"
	h: "하트"
	c: "클로버"
	d: "다이아몬드"
VALUE_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "잭", "퀸", "킹", "에이스"]

# UTILITIES
floor = Math.floor
lexicographic_compare = (a, b) ->
	if a == b
		0
	else if a < b
		-1
	else
		1
assert = (conditional, message = "") ->
	if not conditional
		console.log(message)
		alert(message)

Array::remove = (elem) ->
	@splice(@indexOf(elem), 1)[0]

runInterval = (interval, funcs) ->
	runner = ->
		funcs[0]()
		funcs.splice(0, 1)
		if funcs.length > 0
			setTimeout(runner, interval)
	setTimeout(runner, interval)

# 게임 관련 유틸리티

renderFaceName = (face) ->
	suit = SUIT_NAMES[face[0]]
	value = VALUE_NAMES[VALUE_ORDER.indexOf(face[1])]
	return "#{suit} #{value}"

isScoreCard = (face) ->
	face[1] in SCORE_CARD_VALUES

# MODELS
class Card
	constructor: (@playing_field, @face, @direction, x, y) ->
		# 카드 엘레멘트 생성
		@elem = $("#card_template")
			.clone()
			.addClass(@face)
			.addClass(@direction)
			.appendTo(@playing_field.elem)

		size = @getSize()
		@elem.css("left", (x - floor(size.width / 2)) + "px")
			.css("top", (y - floor(size.height / 2)) + "px")

		@playing_field.addCard(this)

	getSize: ->
		if @direction == "vertical"
			{width: CARD_WIDTH, height: CARD_HEIGHT}
		else
			{width: CARD_HEIGHT, height: CARD_WIDTH}

	moveTo: (cx, cy, duration) ->
		sz = @getSize()
		left = cx - floor(sz.width / 2)
		top = cy - floor(sz.height / 2)
		@elem.animate({left: left, top: top}, duration)

	setFace: (face) ->
		@elem.removeClass(@face).addClass(face)
		@face = face

	setDirection: (direction) ->
		@elem.removeClass(@direction).addClass(direction)
		@direction = direction

	remove: ->
		@elem.remove()
		null

class PlayingField
	constructor: (@elem) ->
		@cards = []
		@players = []
		@playedCards = []
		@collected = []

	getLocationInfo: (player) ->
		 PLAYER_LOCATION[@players.length][player]

	getCardDirection: (player) ->
		side = @getLocationInfo(player).side
		if side in ["top", "bottom"] then "vertical" else "horizontal"

	# 플레이어 x가 y장째 수집한 카드의 위치는?
	getCollectedPosition: (player, index) ->
		return @getHandPosition(player, 14, index + 15)

	# 플레이어 x가 y장 카드를 가지고 있을 때, z번 카드의 가운데 위치는?
	getHandPosition: (player, cards, index) ->
		{side: side, location: location} = @getLocationInfo(player)
		PLAYER_LOCATION[@players.length][player]
		# 깔끔하게 구현하고 싶지만.. -_-
		dx = dy = 0
		if side in ["top", "bottom"]
			cx = @convertRelativePosition(location, 0).x
			if side == "top"
				cy = CARD_HEIGHT / 2
				dx = -1
			else
				cy = @getSize().height - CARD_HEIGHT / 2
				dx = 1
		else
			cy = @convertRelativePosition(0, location).y
			if side == "left"
				cx = CARD_HEIGHT / 2
				dy = 1
			else
				cx = @getSize().width - CARD_HEIGHT / 2
				dy = -1
		totalWidth = CARD_WIDTH + (cards - 1) * CARD_OVERLAP
		fx = cx + dx * (floor(totalWidth / 2) - CARD_WIDTH / 2)
		fy = cy + dy * (floor(totalWidth / 2) - CARD_WIDTH / 2)
		{x: floor(fx - dx * CARD_OVERLAP * index), y: floor(fy - dy * CARD_OVERLAP * index)}

	getProfilePosition: (player) ->
		{side: side, location: location} = @getLocationInfo(player)
		# 깔끔하게 구현하고 싶지만.. -_-
		width = if side in ["top", "bottom"] then 254 else 200
		height = if side in ["top", "bottom"] then 50 else 104
		if side in ["top", "bottom"]
			return {
				side: side,
				x: @convertRelativePosition(location, 0).x - width / 2,
				y: if side == "top" then CARD_HEIGHT + PROFILE_CARD_GAP else @getSize().height - CARD_HEIGHT - PROFILE_CARD_GAP - height
			}
		else
			return {
				side: side,
				y: @convertRelativePosition(0, location).y - height / 2,
				x: if side == "left" then CARD_HEIGHT + PROFILE_CARD_GAP else @getSize().width - CARD_HEIGHT - PROFILE_CARD_GAP - width
			}

	clearCards: ->
		@cards.pop().remove() while @cards.length > 0
		null

	getSize: ->
		{width: @elem.width(), height: @elem.height()}

	addCard: (card) ->
		@cards.push(card)

	convertRelativePosition: (x, y) ->
		sz = @getSize()
		{x: floor(sz.width * x), y: floor(sz.height * y)}

	sortHands: (player) ->
		if @hands[player].length == 0 or @hands[player][0].face[0] == "b"
			return
		@hands[player].sort((a, b) ->
			if a.face[0] != b.face[0]
				lexicographic_compare(a.face[0], b.face[0])
			else
				VALUE_ORDER.indexOf(a.face[1]) - VALUE_ORDER.indexOf(b.face[1])
		)
		n = @hands[player].length
		for i in [0..n-1]
			@hands[player][i].elem.css({"z-index": n-i})
		@repositionCards(player)


	# 각 플레이어의 카드가 주어질 때 셔플 애니메이션을 보여주고, hand[] 에 각 카드를 등록한다
	deal: (cards, startFrom, done=->) ->
		@clearCards()
		assert(cards.length == @players.length)
		@hands = ([] for i in [0..@players.length-1])
		@collected = ([] for i in [0..@players.length-1])
		center = @convertRelativePosition(0.5, 0.5)
		@cardStack = []
		for i in [0..52]
			card = new Card(this, "back", "vertical", center.x, center.y - floor(i / 4) * 2)
			card.elem.addClass("group" + (floor(i / 4) %2)).delay(i * SPEED_BASE / 10).fadeIn(0)
			@cardStack.push(card)
		# 마지막 카드가 보여지고 나면 셔플 동작을 한다
		@cardStack[52].elem.promise().done(=>
			for i in [0..0]
				$(".group0")
					.animate({left: "-=37"}, SPEED_BASE*3)
					.animate({top: "-=2"}, 0)
					.animate({left: "+=74"}, SPEED_BASE*6)
					.animate({top: "+=2"}, 0)
					.animate({left: "-=37"}, SPEED_BASE*3)
				$(".group1")
					.animate({left: "+=37"}, SPEED_BASE*3)
					.animate({top: "+=2"}, 0)
					.animate({left: "-=74"}, SPEED_BASE*6)
					.animate({top: "-=2"}, 0)
					.animate({left: "+=37"}, SPEED_BASE*3)
			# 셔플을 다 하고 나면 카드를 돌린다
			$(".group1").promise().done(=>
				dealt = 0
				for index in [0..cards[0].length-1]
					for pl in [0..@players.length-1]
						player = (startFrom + pl) % @players.length
						card = @cardStack.pop()
						@hands[player].push(card)
						face = cards[player][index]
						do (card, face, player, index, dealt) =>
							setTimeout(
								=>
									card.setFace face
									card.setDirection @getCardDirection player
									pos = @getHandPosition(player, cards[0].length, index)
									card.moveTo(pos.x, pos.y, SPEED_BASE)
									null
								, dealt * SPEED_BASE)
						dealt++

				setTimeout(
					=>
						for i in [0..@cardStack.length-1]
							@cardStack[i].elem.animate({top: "-=#{i * 2}", left: "-=#{ i * 2 }"}, 50)
						for player in [0..@players.length-1]
							@sortHands(player)
						null
					, dealt * SPEED_BASE
				)
				setTimeout(done, dealt * SPEED_BASE)
				null
			)
			null
		)
		null

	repositionCards: (player) ->
		for i in [0..@hands[player].length-1]
			pos = @getHandPosition(player, @hands[player].length, i)
			@hands[player][i].moveTo(pos.x, pos.y, SPEED_BASE * 5)

	# cardStack 에 남은 카드들을 player 에게 준다.
	dealAdditionalCards: (faces, player, done=->) ->
		n = faces.length
		assert(n == @cardStack.length)
		for idx in [0..n-1]
			card = @cardStack.pop()
			do (idx, card) =>
				setTimeout(
					=>
						card.setFace(faces[idx])
						card.setDirection @getCardDirection player
						@hands[player].push(card)
						@repositionCards(player)
						null
					, idx * SPEED_BASE*5
				)
		setTimeout(
			=>
				@sortHands(player)
				done()
			, n * SPEED_BASE*5)
		null

	globalMessage: (message, fadeOutAfter=5000) ->
		$("#global_message").hide().clearQueue().html(message).fadeIn(500).delay(fadeOutAfter).fadeOut(500)


	playerMessage: (player, type, message = "") ->
		elem = @players[player].profile_elem
		elem.find("dd")
			.clearQueue()
			.stop()
			.animate({"background-color": "rgba(255, 255, 255, 0.8)"}, 150)
			.animate({"background-color": "rgba(0, 0, 0, 0.1)"}, 4000)
		elem.find(".message_type").html(type)
		elem.find(".message_content").html(message)

	setPlayers: (players) ->
		if @players
			player.profile_elem.remove() for player in @players
		@players = players
		for i in [0..@players.length-1]
			{side: side, y: y, x: x} = @getProfilePosition(i)
			elem = $("#profile_template")
				.clone()
				.addClass(side)
				.appendTo(@elem)
			elem.find(".picture").attr({src: @players[i].picture})
			elem.find(".name").html(@players[i].name)
			elem.css({left: x, top: y})
			elem.show()
			@players[i].profile_elem = elem

	setPlayerType: (player, typeName) ->
		@players[player].profile_elem.find(".type").html(typeName).addClass(typeName)

	playCard: (player, card, render_as=null) ->
		if typeof(card) == "string"
			face = card
			card = null
			for c in @hands[player]
				if c.face == face
					card = c
					break
		if card == null
			card = @hands[player].pop()
			card.setFace(face)
		@hands[player].remove(card)
		@playedCards.push(card)
		@playerMessage(player, "플레이", render_as or renderFaceName(card.face))
		@repositionCards(player)

		card.elem.css("z-index", @playedCards.length)
		card.setDirection("vertical")

		angle = @getLocationInfo(player).angle
		center = @convertRelativePosition(0.5, 0.5)
		x = center.x + Math.cos(angle) * PLAYED_CARD_RADIUS
		y = center.y - Math.sin(angle) * PLAYED_CARD_RADIUS
		card.moveTo(x, y, SPEED_BASE * 5)

	endTurn: (winner, collectCards=false) ->
		take = []
		collect = []
		for card in @playedCards
			if isScoreCard(card.face) and collectCards
				collect.push(card)
			else
				take.push(card)
		@playerMessage(winner, "턴 승리", "이 턴을 승리하였습니다!")
		@takeCards(winner, take)
		@collectCards(winner, collect)
		@playedCards = []

	collectCards: (player, cards) ->
		for card in cards
			@collected[player].push(card)
			pos = @getCollectedPosition(player, @collected[player].length-1)
			card.moveTo(pos.x, pos.y, SPEED_BASE * 5)

	takeCards: (player, cards, done = ->) ->
		home = @getHandPosition(player, 1, 0)
		[dx, dy] = DISAPPEAR_DIRECTION[@getLocationInfo(player).side]
		cx = home.x + dx
		cy = home.y + dy

		for i in [0..cards.length-1]
			cards[i].elem
				.animate({top: cy, left: cx}, SPEED_BASE * 5)
				.fadeOut(0)
		setTimeout(
			=>
				card.remove() for card in cards
				done()
			, SPEED_BASE * 5)

	chooseCard: (done=->) ->
		player = 0
		finish = (card) =>
			for c in @hands[player]
				c.elem
					.removeClass("canChoose")
					.unbind()
			done(card)
		for card in @hands[player]
			do (card) =>
				card.elem
					.addClass("canChoose")
					.mouseover(-> $(this).animate({top: "-=10"}, SPEED_BASE))
					.mouseout(-> $(this).animate({top: "+=10"}, SPEED_BASE))
					.mousedown(-> finish(card))

	chooseMultipleCards: (choose, done=->) ->
		player = 0
		@chosen = []
		multiple = @elem.find(".choose_multiple")
		multiple.find(".choose_count").html(choose)
		multiple.fadeIn(500)

		finished = () =>
			multiple.fadeOut(500)
			for card in @hands[player]
				card.elem
					.removeClass("canChoose")
					.unbind()
			done(@chosen)

		getHandlers = (card) =>
			raised = false

			raise = ->
				if not raised
					raised = true
					card.elem.animate({top: "-=10"}, SPEED_BASE)
			deraise = ->
				if raised
					raised = false
					card.elem.animate({top: "+=10"}, SPEED_BASE)

			{
				onMouseOver: =>
					if @chosen.length < choose and card not in @chosen
						raise()
				onMouseDown: =>
					if @chosen.length < choose and card not in @chosen
						@chosen.push(card)
						card.elem.addClass("chosen")
						raise()
					else if card in @chosen
						@chosen.remove(card)
						card.elem.removeClass("chosen")
						deraise()
					if @chosen.length == choose
						multiple.find("button")
							.removeAttr("disabled")
							.click(finished)
					else
						multiple.find("button").attr("disabled", "")

				onMouseOut: =>
					if card not in @chosen
						deraise()
			}

		for card in @hands[player]
			handlers = getHandlers(card)
			card.elem
				.addClass("canChoose")
				.mouseover(handlers.onMouseOver)
				.mousedown(handlers.onMouseDown)
				.mouseout(handlers.onMouseOut)
		null




field = null

TEST_CARDS = [["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3", "s4", "c3"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]]

$(document).ready(->
	window.field = new PlayingField $ "#playing_field"
	window.field.setPlayers([
		{name: "JongMan Koo", picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/49218_593417379_9696_q.jpg"}
		{name: "Wonha Ryu", picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/41489_100000758278961_2887_q.jpg"}
		{name: "Jinho Kim", picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/161338_100000247121062_7309182_q.jpg"}
		{name: "DoKyoung Lee", picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/273911_100001947905915_2944452_q.jpg"}
		{name: "Hyun-hwan Jung", picture: "http://profile.ak.fbcdn.net/hprofile-ak-snc4/202947_100002443708928_4531642_q.jpg"}
	])
	window.field.globalMessage("새 게임을 시작합니다")
	SPEED_BASE = 50
	GAP = SPEED_BASE * 20
	window.field.deal TEST_CARDS, 1, ->
		window.field.globalMessage("선거가 시작됩니다!")
		setTimeout(
			->
				window.field.playerMessage(1, "패스")
			, GAP)
		setTimeout(
			->
				window.field.playerMessage(2, "공약", "다이아몬드 14")
			, GAP*2)
		setTimeout(
			->
				window.field.playerMessage(3, "공약", "클로버 15")
			, GAP*3)
		setTimeout(
			->
				window.field.playerMessage(4, "패스")
			, GAP*4)
		setTimeout(
			->
				window.field.playerMessage(0, "공약", "스페이드 16")
			, GAP*5)
		setTimeout(
			->
				window.field.playerMessage(2, "패스")
			, GAP*6)
		setTimeout(
			->
				window.field.playerMessage(3, "패스")
				window.field.globalMessage("JongMan Koo 님이 당선되었습니다!")
				window.field.playerMessage(0, "당선", "스페이드 16")
				window.field.setPlayerType(0, "주공")
			, GAP*7)
		setTimeout(
			->
				###
				window.field.dealAdditionalCards(["back", "back", "back"], 1,
				->
					window.field.takeCards(1, (window.field.hands[1].pop() for i in [0..2]))
				)
				###
				window.field.dealAdditionalCards(["sq", "jr", "hk"], 0,
				->
					window.field.globalMessage("JongMan Koo님이 당을 재정비하고 있습니다.")
					window.field.chooseMultipleCards(3,
						(chosen) ->
							window.field.takeCards(0, chosen,
								->
									window.field.hands[0].remove(card) for card in chosen
									window.field.repositionCards(0)
									window.field.globalMessage("1턴이 시작되었습니다 !")

									window.field.playerMessage(0, "플레이", "차례입니다.")
									window.field.chooseCard((card) ->
										console.log("will play", card.face)
										window.field.playCard(0, "jr", "기루다 컴!")
										runInterval(GAP,
											[
												-> window.field.playCard(1, "ct")
												-> window.field.playCard(2, "sj")
												-> window.field.playCard(3, "c2")
												-> window.field.playCard(4, "st")
												-> window.field.endTurn(0, false)
											])
									)
							)
					)
				)
				# ##
			, GAP*8)

)
