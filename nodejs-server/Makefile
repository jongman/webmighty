all: clientlib.js rule.js game.js
game.js: game.coffee
	coffee -c game.coffee
rule.js: rule.coffee
	coffee -c -b rule.coffee
clientlib.js: clientlib.coffee
	coffee -c clientlib.coffee
