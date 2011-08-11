// CONSTANTS =============================================

var CARD_WIDTH = 71;
var CARD_HEIGHT = 96;
var CARD_OVERLAP = 16;
var DEALING_SPEED = 100;

// 5인 플레이시, 6인 플레이시 각 플레이어의 위치
var PLAYER_LOCATION = {
	5: {
		   "side": ["bottom", "left", "top", "top", "right"],
		   "location": [0.5, 0.5, 0.25, 0.75, 0.5]
	   }
};
// MODELS ======================================

function Card(playing_field, face, direction, x, y, classes, hidden) {
	this.playing_field = playing_field;
	this.face = face;
	this.direction = direction;	
	this.elem = $("#card_template")
		.clone()
		.addClass(face)
		.addClass(direction);
	
	if(!hidden) 
		this.elem.show();
	else
		this.elem.hide();

	this.elem.appendTo(playing_field.elem);

	for(var i in classes)
		this.elem.addClass(classes[i]);

	var size = this.getSize();
	$(this.elem)
		.css("left", (x - Math.floor(size.width / 2)) + "px")
		.css("top", (y - Math.floor(size.height / 2)) + "px");

	// 자기 자신을 등록한다
	this.playing_field.addCard(this);
}

Card.prototype.getSize = function() {
	if(this.direction == "vertical") 
		return {width: CARD_WIDTH, height: CARD_HEIGHT};
	return {height: CARD_WIDTH, width: CARD_HEIGHT};
}

Card.prototype.moveTo = function(cx, cy, duration, delay) {
	if(!delay) delay = 0;
	var th = $(this.elem);
	var size = this.getSize();
	var left = cx - Math.floor(size.width / 2);
	var top = cy - Math.floor(size.height / 2);
	th.delay(delay).animate({left: left, top: top}, duration);
}

Card.prototype.setFace = function(face) {
	$(this.elem).removeClass(this.face).addClass(face);
	this.face = face;
}

Card.prototype.setDirection = function(dir) {
	$(this.elem).removeClass(this.direction).addClass(dir);
	this.direction = dir;
}

Card.prototype.remove = function() {
	$(this.elem).remove();
}

function PlayingField(elem) {
	this.elem = elem;
	this.cards = [];
	this.hand = [];
	this.players = 5;
}

PlayingField.prototype.getCardDirection = function(player) {
	var side = PLAYER_LOCATION[this.players].side[player];
	if(side === "top" || side === "bottom") return "vertical";
	return "horizontal";
}

// 플레이어 x가 y장 카드를 가지고 있을 때, z번 카드의 가운데 위치는?
PlayingField.prototype.getCardPosition = function(player, cards, index) {
	POSITION_INFO = PLAYER_LOCATION[this.players];
	var side = POSITION_INFO.side[player];
	var location = POSITION_INFO.location[player];
	var cx, cy, dx, dy;
	// 깔끔하게 구현하고 싶지만.... -_-
	if(side === "top" || side === "bottom") {
		cx = this.convertRelativePosition(location, 0).x;
		dy = 0;
		if(side === "top") {
			cy = CARD_HEIGHT / 2;
			dx = -1;
		}
		else {
			cy = this.getSize().height - CARD_HEIGHT / 2;
			dx = 1;
		}
	}
	else {
		cy = this.convertRelativePosition(0, location).y;
		dx = 0;
		if(side === "left") {
			cx = CARD_HEIGHT / 2;
			dy = 1;
		}
		else {
			cx = this.getSize().width - CARD_HEIGHT / 2;
			dy = -1;
		}
	}

	var width = CARD_WIDTH + (cards - 1) * CARD_OVERLAP;
	var firstX = cx + dx * (Math.floor(width / 2) - CARD_WIDTH / 2);
	var firstY = cy + dy * (Math.floor(width / 2) - CARD_WIDTH / 2);
	// console.log("player", player, "cards", cards, "idx", index,
	// 		    "cx", cx, "cy", cy, "dx", dx, "dy", dy, "width", width);
	return {x: firstX - dx * CARD_OVERLAP * index,
		    y: firstY - dy * CARD_OVERLAP * index};
}

// 모든 카드를 지운다
PlayingField.prototype.clear = function() {
	for(var i in this.cards) {
		this.cards[i].remove();
	}
	this.cards = [];
};

// 플레잉 필드 사이즈
PlayingField.prototype.getSize = function() {
	return {width: $(this.elem).width(), height: $(this.elem).height() };
};

// 새 카드를 추가한다
PlayingField.prototype.addCard = function(card) {
	this.cards.push(card);
};

PlayingField.prototype.convertRelativePosition = function(x, y) {
	return {x: Math.floor($(this.elem).width() * x),
		    y: Math.floor($(this.elem).height() * y)};
};

PlayingField.prototype.deal = function(cards, startFrom) {
	this.clear();
	this.players = cards.length;
	var players = cards.length;
	var me = this;

	var center = this.convertRelativePosition(0.5, 0.5);
	var cardStack = [];

	// 카드를 주르륵 쌓는다
	for(var i = 0; i < 53; ++i) {
		var card = new Card(this, "back", "vertical", 
							center.x, center.y - Math.floor(i / 4) * 2, 
							["group" + (Math.floor(i / 4) % 2)], true);
		card.elem.delay(i * 5).fadeIn(0);
		cardStack.push(card);
	}

	// 마지막 카드가 보여지고 나면 셔플 동작을 한다
	cardStack[52].elem.promise().done(function() {
		for(var i = 0; i < 2; ++i) {
			$(".group0")
				.animate({left: "-=37"}, 100)
				.animate({top: "-=2"}, 0)
				.animate({left: "+=74"}, 200)
				.animate({top: "+=2"}, 0)
				.animate({left: "-=37"}, 100);
			$(".group1")
				.animate({left: "+=37"}, 100)
				.animate({top: "+=2"}, 0)
				.animate({left: "-=74"}, 200)
				.animate({top: "-=2"}, 0)
				.animate({left: "+=37"}, 100);
		}
		// 셔플을 다 하고 나면 카드를 돌린다
		$(".group1").promise().done(function() {
			console.log("done!");
			var dealt = 0;
			for(var i = 0; i < cards[0].length; ++i) {
				for(var j = 0; j < players; ++j) {
					var face = cards[j][i];
					var card = cardStack.pop();

					function getDeal(card, face, player, index) {
						return function() {
							card.setFace(face);
							card.setDirection(me.getCardDirection(player));
							var position = me.getCardPosition(player, cards[0].length, index);
							card.moveTo(position.x, position.y, DEALING_SPEED);
						}
					}		
					setTimeout(getDeal(card, face, j, i), dealt * DEALING_SPEED);
					dealt++;										
				}
			}
		});
	});
	/*
	function deal_card(card_index) {		
		var player = card_index % players;
		var idx = Math.floor(card_index / players);
		if(idx >= cards[player].length) {
			console.log("bye bye");
			return;
		}
		var face = cards[player][idx];
		var card = cardStack.pop();
		//console.log("player=" + player + " idx=" + idx + " length=" + cards[player].length + " face=" + face);
		card.setFace(face);
		card.setDirection(me.getCardDirection(player));
		var position = me.getCardPosition(player, cards[player].length, idx);
		card.moveTo(position.x, position.y, DEALING_SPEED);
		return schedule(function() { return deal_card(card_index+1); }, DEALING_SPEED);
	}

	function shift(repeat) {
		var group1 = repeat % 2;
		var group2 = (repeat + 1) % 2;
		$(".group" + group1).animate({top: "-=2"}, 0).animate({left: "+=37"}, 100);
		$(".group" + group2).animate({top: "+=2"}, 0).animate({left: "-=37"}, 100);
		if(repeat > 1) 
			return schedule(function() { return split(repeat-1); }, 100);
		return schedule(function() { return deal_card(0); }, 100);		
	}

	function split(repeat, direction) {
		var group1 = repeat % 2;
		var group2 = (repeat + 1) % 2;
		$(".group" + group1).animate({left: "-=37"}, 100);
		$(".group" + group2).animate({left: "+=37"}, 100);
		return schedule(function() { return shift(repeat); }, 100);
	}

	function addCard(idx) {
		cardStack.push(new Card(me, 
							    "back", 
								"vertical", 
								center.x,
								center.y - Math.floor(idx / 4) * 2, 
								["group" + (Math.floor(idx / 4) % 2)]));
		if(idx == 52) 
			return schedule(function() { return split(2); }, 100);
		return schedule(function() { return addCard(idx+1); }, 5);
	}

	run_async(schedule(function() { return addCard(0); }, 5));
	*/
}

var field = null;
var TEST_CARDS = [["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3", "s4", "c3"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]]

$(document).ready(function() {
	field = new PlayingField($("#playing_field"));
	field.deal(
		TEST_CARDS,
		0);
});
