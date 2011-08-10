
function schedule(func, time) {
	return {func: func, time: time}
}

function run_async(scheduled) {
	function runner(func) {
		return function() {
			var ret = func();
			if(ret === null || ret === undefined) return;
			setTimeout(runner(ret.func), ret.time);
		}
	}
	setTimeout(runner(scheduled.func), scheduled.time);
}

function Card(playing_field, classes, x, y) {
	this.playing_field = playing_field;
	this.elem = $("#card_template")
		.clone()
		.appendTo(playing_field.elem)
	for(var i in classes)
		$(this.elem).addClass(classes[i]);
	var width = $(this.elem).width();
	var height = $(this.elem).height();
	$(this.elem)
		.css("left", (x - Math.floor(width/2)) + "px")
		.css("top", (y - Math.floor(height/2)) + "px")
		.show();

	// 자기 자신을 등록한다
	this.playing_field.addCard(this);
}

Card.prototype.remove = function() {
	$(this.elem).remove();
}

function PlayingField(elem) {
	this.elem = elem;
	this.cards = [];
	this.hand = [];
}

// 5인 플레이시, 6인 플레이시 각 플레이어의 위치
var card_location = {
	5: {
		   "side": ["bottom", "left", "top", "top", "right"],
		   "location": [0.5, 0.5, 0.25, 0.75, 0.5]
	   }
};

// 모든 카드를 지운다
PlayingField.prototype.clear = function(cards) {
	for(var card in this.cards) {
		card.remove();
	}
	this.cards = [];
}

// 새 카드를 추가한다
PlayingField.prototype.addCard = function(card) {
	this.cards.push(card);
}

PlayingField.prototype.getRelativeX = function(loc) {
	return Math.floor($(this.elem).width() * loc);
}

PlayingField.prototype.getRelativeY = function(loc) {
	return Math.floor($(this.elem).height() * loc);
}

PlayingField.prototype.deal = function(cards, startFrom) {
	var cx = this.getRelativeX(0.5);
	var cy = this.getRelativeY(0.5);
	var cardStack = [];
	var me = this;

	var cardStack = [];

	function shift(repeat) {
		var group1 = repeat % 2;
		var group2 = (repeat + 1) % 2;
		$(".group" + group1).animate({top: "-=2"}, 0).animate({left: "+=37"}, 100);
		$(".group" + group2).animate({top: "+=2"}, 0).animate({left: "-=37"}, 100);
		if(repeat > 1) {
			return schedule(function() { return split(repeat-1); }, 100);
		}
	}

	function split(repeat, direction) {
		var group1 = repeat % 2;
		var group2 = (repeat + 1) % 2;
		$(".group" + group1).animate({left: "-=37"}, 100);
		$(".group" + group2).animate({left: "+=37"}, 100);
		return schedule(function() { return shift(repeat); }, 100);
	}

	function addCard(idx) {
		cardStack.push(new Card(me, ["back", "vertical", "group" + (Math.floor(idx / 4) % 2)], cx, cy - Math.floor(idx / 4) * 2));
		if(idx == 52) 
			return schedule(function() { return split(2); }, 5);
		return schedule(function() { return addCard(idx+1); }, 5);
	}
	run_async(schedule(function() { return addCard(0); }, 5));
}

var field = null;

$(document).ready(function() {
	field = new PlayingField($("#playing_field"));
	field.deal(
		[["s1", "h2", "ht", "h1", "h4", "sk", "s2", "s3", "s4", "c3"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
 		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"],
		 ["back", "back", "back", "back", "back", "back", "back", "back", "back", "back"]],
		0);
});
