const { cloudinary } = require('../cloudinary');
const Recipe = require('../models/recipe-bar')


module.exports.renderSearchRecipes = async (req, res) => {
    const recipes = await Recipe.find({})
    const sortedRecipes = recipes.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
    res.render('recipe/recipes-search', { sortedRecipes: sortedRecipes })
}

module.exports.renderAddRecipe = async (req, res) => {
    res.render('recipe/recipe-add')
}

module.exports.renderRecipeShow = async (req, res) => {
    const recipe = await Recipe.findById(req.params.id)
    res.render('recipe/recipe-show', { recipe, session: req.session })
}

module.exports.createRecipe = async (req, res) => {
    try {
        const {
            name,
            totalVolume,
            method,
            grinderStep,
            waterTemp,
            brewTime,
            recipent,
            garnish,
            shop
        } = req.body.recipe
        console.log(req.body)
        const newRecipe = new Recipe({
            name: name,
            totalVolume: totalVolume,
            method: method,
            grinderStep: grinderStep,
            waterTemp: waterTemp,
            brewTime: brewTime,
            recipent: recipent,
            garnish: garnish,
            shop: shop
        })
        const ingredients = req.body.recipe.ingredients
        const nameArray = ingredients.name
        if (Array.isArray(nameArray)) {
            for (let i = 0; i < nameArray.length; i++) {
                const newIng = {
                    name: ingredients.name[i],
                    um: ingredients.um[i],
                    quantity: ingredients.quantity[i]
                }
                newRecipe.ingredients.push(newIng)
            }
        } else {
            newRecipe.ingredients.push(ingredients)
        }
        if (req.file) {
            console.log(req.file)
            const { fieldname, path } = req.file
            newRecipe.image.filename = fieldname
            newRecipe.image.path = path
        }
        console.log(newRecipe)
        await newRecipe.save()
        res.redirect('back')
    } catch (err) {
        console.log(err)
        res.redirect('back')
    }
}

module.exports.renderEditRecipe = async (req, res) => {
    try {
        const id = req.params.id
        const recipe = await Recipe.findById(id)
        res.render('recipe/recipe-edit', { recipe })
    } catch (err) {
        console.log(err)
        res.redirect('/recipes')
    }
}

module.exports.editRecipe = async (req, res) => {
    const id = req.params.id
    const {
        name,
        totalVolume,
        method,
        grinderStep,
        waterTemp,
        brewTime,
        recipent,
        garnish,
    } = req.body.recipe
    const recipe = await Recipe.findById(id)
    recipe.name = name;
    recipe.totalVolume = totalVolume;
    recipe.method = method
    recipe.grinderStep = grinderStep;
    recipe.waterTemp = waterTemp;
    recipe.brewTime = brewTime;
    recipe.recipent = recipent;
    recipe.garnish = garnish;

    const ingredients = req.body.recipe.ingredients
    const nameArray = ingredients.name
    let ingArr = []
    if (Array.isArray(nameArray)) {
        for (let i = 0; i < nameArray.length; i++) {
            const newIng = {
                name: ingredients.name[i],
                um: ingredients.um[i],
                quantity: ingredients.quantity[i]
            }
            ingArr.push(newIng)
        }
        recipe.ingredients = ingArr
    } else {
        recipe.ingredients.length = 0
        ingArr.push(ingredients)
        recipe.ingredients = ingArr
    }
    if (req.file) {
        const { filename, path } = req.file
        recipe.image.filename = filename
        recipe.image.path = path
    }
    await recipe.save()
    res.redirect(`/recipes/${id}`)
}

module.exports.deleteRecepie = async (req, res) => {
    try {
        const { id } = req.params
        const recipe = await Recipe.findOne({ _id: id })
        const { image } = recipe
        if (image.filename) {
            await cloudinary.uploader.destroy(image.filename)
        }
        await Recipe.findByIdAndDelete(id)
        res.redirect('/recipes');
    } catch (err) {
        console.log(err)
        res.redirect('/recipes')
    }
}




