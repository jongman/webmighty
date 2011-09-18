all: clientlib.js rule.js ../public/js/game.js
../public/js/game.js: ../public/js/game.coffee
	make -C ../public/js
rule.js: rule.coffee
	coffee -c -b rule.coffee
clientlib.js: clientlib.coffee
	coffee -c clientlib.coffee
