var router = require('express').Router();


router.get('/scripts/game_objects.js', function(req, res) {
	res.sendfile('./scripts/game_objects.js');
});

router.get('/scripts/gameplay.js', function(req, res) {
	res.sendfile('./scripts/gameplay.js');
});

router.get('/style/style.css' , function(req, res) {
	res.sendfile('./style/style.css');
});

router.get('/images/card_icons_resized.png', function(req, res) {
	res.sendfile('./images/card_icons_resized.png');
});

router.get('/images/img_trans.gif', function(req, res) {
	res.sendfile('./images/img_trans.gif');
});

router.get('/font/Campanile.ttf', function(req, res) {
	res.sendfile('/font/Campanile.ttf');
});

module.exports = exports = router;