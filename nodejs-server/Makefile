all: clientlib.js rule.js game.js db.js
game.js: game.coffee
	coffee -c game.coffee
rule.js: rule.coffee
	coffee -c -b rule.coffee
db.js: db.coffee
	coffee -c -b db.coffee
clientlib.js: clientlib.coffee
	coffee -c clientlib.coffee
