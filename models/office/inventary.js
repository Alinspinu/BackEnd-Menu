const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const inventarySchema = new Schema({
    date: Date,
    ingredients: [
        {
            ing: {
                type: Schema.Types.ObjectId,
                ref: 'IngredientInv'
            },
            name: String,
            faptic: Number,
            scriptic: Number,
            gestiune: String,
            dep: String,
        }
    ],
    updated: Boolean,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }
})


module.exports = mongoose.model("Inventary", inventarySchema);