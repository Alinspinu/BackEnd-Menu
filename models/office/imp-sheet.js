const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const imparimentSheetSchema = new Schema({
    date: {
        type: Date, 
        index: true
    },
    ings: [
        {
            qty: Number,
            ing: {
                type: Schema.Types.ObjectId,
                ref: "IngredientInv"
            }
        }
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }
});


module.exports = mongoose.model("ImpSheet", imparimentSheetSchema);