
# CONSTANTS
CARD_WIDTH = 71
CARD_HEIGHT = 96
CARD_OVERLAP = 24
DEALING_SPEED_FAST = 20
DEALING_SPEED_SLOW = 300
PLAYER_LOCATION =
	5: [
		{ side: "bottom", location: 0.5 }
		{ side: "left", location: 0.6 }
		{ side: "top", location: 0.25 }
		{ side: "top", location: 0.75 }
		{ side: "right", location: 0.6 }
	]

# UTILITIES
floor = Math.floor
assert = (conditional, message = "") ->
	if not conditional
		console.log(message)
		alert(message)

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
		@players = 5

	getCardDirection: (player) ->
		side = PLAYER_LOCATION[@players][player].side
		if side in ["top", "bottom"] then "vertical" else "horizontal"

	# 플레이어 x가 y장 카드를 가지고 있을 때, z번 카드의 가운데 위치는?
	getCardPosition: (player, cards, index) ->
		{side: side, location: location} = PLAYER_LOCATION[@players][player]
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

	# 각 플레이어의 카드가 주어질 때 셔플 애니메이션을 보여주고, hand[] 에 각 카드를 등록한다
	deal: (cards, startFrom, done=->) ->
		@clearCards()
		@players = cards.length
		@hands = ([] for i in [0..@players-1])
		center = @convertRelativePosition(0.5, 0.5)
		@cardStack = []
		for i in [0..52]
			card = new Card(this, "back", "vertical", center.x, center.y - floor(i / 4) * 2)
			card.elem.addClass("group" + (floor(i / 4) %2)).delay(i * 5).fadeIn(0)
			@cardStack.push(card)
		# 마지막 카드가 보여지고 나면 셔플 동작을 한다
		@cardStack[52].elem.promise().done(=>
			for i in [0..0]
				$(".group0")
					.animate({left: "-=37"}, 100)
					.animate({top: "-=2"}, 0)
					.animate({left: "+=74"}, 200)
					.animate({top: "+=2"}, 0)
					.animate({left: "-=37"}, 100)
				$(".group1")
					.animate({left: "+=37"}, 100)
					.animate({top: "+=2"}, 0)
					.animate({left: "-=74"}, 200)
					.animate({top: "-=2"}, 0)
					.animate({left: "+=37"}, 100)
			# 셔플을 다 하고 나면 카드를 돌린다
			$(".group1").promise().done(=>
				dealt = 0
				for index in [0..cards[0].length-1]
					for pl in [0..@players-1]
						player = (startFrom + pl) % @players
						card = @cardStack.pop()
						@hands[player].push(card)
						face = cards[player][index]
						do (card, face, player, index, dealt) =>
							setTimeout(
								=>
									card.setFace face
									card.setDirection @getCardDirection player
									pos = @getCardPosition(player, cards[0].length, index)
									card.moveTo(pos.x, pos.y, DEALING_SPEED_FAST)
									null
								, dealt * DEALING_SPEED_FAST)
						dealt++

				setTimeout(
					=>
						for i in [0..@cardStack.length-1]
							@cardStack[i].elem.animate({top: "-=#{i * 2}", left: "-=#{ i * 2 }"}, 50)
						null
					, dealt * DEALING_SPEED_FAST
				)
				setTimeout(done, dealt * DEALING_SPEED_FAST)
				null
			)
			null
		)
		null
	
	dealAdditionalCards: (faces, player) ->
		console.log(faces)
		n = faces.length
		assert(n == @cardStack.length)
		for idx in [0..n-1]
			card = @cardStack.pop()
			do (idx, card) =>
				console.log(idx)
				setTimeout(
					=>
						card.setFace(faces[idx])
						console.log("dealing", faces[idx], idx)
						card.setDirection @getCardDirection player
						@hands[player].push(card)
						for i in [0..@hands[player].length-1]
							pos = @getCardPosition(player, @hands[player].length, i)
							@hands[player][i].moveTo(pos.x, pos.y, DEALING_SPEED_SLOW)
						null
					, idx * DEALING_SPEED_SLOW
				)
				
				
		null

field = null

TEST_CARDS = [["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3", "s4", "c3"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]]

$(document).ready(->
	window.field = new PlayingField $ "#playing_field"
	window.field.deal TEST_CARDS, 1, ->
		window.field.dealAdditionalCards(["sq", "jr", "hk"], 0)

)
