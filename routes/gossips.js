const express = require('express');
const router = express.Router();
const multer = require('multer')
const { storage } = require('../cloudinary/gossip');
const upload = multer({ storage })
const gossipsCtrl = require('../controlers/gossips');



router.route('/new')
    .post(upload.single('image'), gossipsCtrl.new)

router.route('/fetch/:page')
    .get(gossipsCtrl.fetchGossips)

router.route('/fetch-by-user')
    .get(gossipsCtrl.fetchGossipsByUser)

router.route('/edit')
    .put(upload.single('image'), gossipsCtrl.edit)

router.route('/delete')
    .delete(gossipsCtrl.delete)

router.route('/new-comment')
    .post(gossipsCtrl.newComment)

router.route('/new-like')
    .post(gossipsCtrl.newLike)

router.route('/gossips-likes')
    .get(gossipsCtrl.fetchGossipsAndLikes)

router.route('/fetch-one')
    .get(gossipsCtrl.fetchOne)
module.exports = router;