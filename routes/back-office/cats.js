const express = require('express');
const router = express.Router();

const multer = require('multer');
const { storage } = require('../../cloudinary/index.js');
const upload = multer({ storage });

const catRoutes = require ('../../controlers/back-office/cats')

router.route('/get-cats').get(catRoutes.sendCats);


router.route('/cat-add')
    .post(catRoutes.addCat);

router.route('/search-cat').get(catRoutes.searchCats)


router.route('/cat')
    .put(catRoutes.editCategory)
    .delete(catRoutes.delCategory);



module.exports = router;