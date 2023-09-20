if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const Ingredient = require('../models/ingredient')
const Product = require('../models/product-true')
const axios = require('axios');
const qs = require('qs');


module.exports.getToken = async (req, res, next) => {
    const clientID = process.env.FAT_ID
    const clientSecret = process.env.FAT_SECRET
    const data = qs.stringify({
        'grant_type': 'client_credentials',
        'scope': 'basic'
    });

    const config = {
        method: 'post',
        url: 'https://oauth.fatsecret.com/connect/token',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };
    try {
        const accessResponse = await axios(config)
        const accessToken = accessResponse.data.access_token
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
        const data = {
            method: 'foods.search.v2',
            search_expression: 'bread',
            format: 'json',
            include_sub_categories: true
        };
        const dataResponse = await axios.post('https://platform.fatsecret.com/rest/server.api', null, { headers: headers, params: data })
        console.log(dataResponse.data)
    } catch (err) {
        console.log(err)
    }

    res.status(200).json({ messgage: "ss" })
}


module.exports.saveIngredient = async(req, res, next) => {
    try {
        const ing = new Ingredient(req.body);
        await ing.save()
        res.status(200).json({ message: `Ingredientul ${ing.name} was created!`});
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err });
    }
}

module.exports.sendIngredients = async(req, res, next) => {
    console.log('hit')
    try{
        const ingredients = await Ingredient.find()
        res.status(200).json(ingredients)
    }catch (err) {  
        console.log(err)
        res.status(500).json({ message: err });
    }
}

module.exports.saveIngredientsToProduct = async (req, res, next) => {
    const {id} = req.query
    console.log(id)
    try{
        const product = await Product.findById(id)
        product.ingredients = req.body
        await product.save()
        console.log(product)
    }catch (err) {  
        console.log(err)
        res.status(500).json({ message: err });
    }
}