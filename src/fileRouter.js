var router = require("express").Router();

router.get("/scripts/game_objects.js", function(req, res) {
  res.sendfile("./public/scripts/game_objects.js");
});

router.get("/scripts/gameplay.js", function(req, res) {
  res.sendfile("./public/scripts/gameplay.js");
});

router.get("/scripts/socket.js", function(req, res) {
  res.sendfile("./public/scripts/socket.js");
});

router.get("/style/style.css", function(req, res) {
  res.sendfile("./public/style/css/style.css");
});

router.get("/style/style.less", function(req, res) {
  res.sendfile("./public/style/css/style.less");
});

router.get("/images/card_icons_resized.png", function(req, res) {
  res.sendfile("./public/images/card_icons_resized.png");
});

router.get("/images/goyard.jpg", function(req, res) {
  res.sendfile("./public/images/goyard.jpg");
});

router.get("/images/img_trans.gif", function(req, res) {
  res.sendfile("./public/images/img_trans.gif");
});

router.get("/font/Campanile.ttf", function(req, res) {
  res.sendfile("./public/style/font/Campanile.ttf");
});

module.exports = exports = router;
