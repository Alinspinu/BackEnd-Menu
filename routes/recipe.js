const express = require("express");
const router = express.Router();
const multer = require('multer')
const { storage } = require('../cloudinary/index.js');
const upload = multer({ storage })

const recipeControlers = require('../controlers/recipes')

router.route('/').get(recipeControlers.renderSearchRecipes)
router.route('/add')
    .get(recipeControlers.renderAddRecipe)
    .post(upload.single('recipe-image'), recipeControlers.createRecipe)
router.route('/:id')
    .get(recipeControlers.renderRecipeShow)
    .delete(recipeControlers.deleteRecepie)
    .put(upload.single('recipe-image'), recipeControlers.editRecipe)
router.route('/:id/edit')
    .get(recipeControlers.renderEditRecipe)


module.exports = router