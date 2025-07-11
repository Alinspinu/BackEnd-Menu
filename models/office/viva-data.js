const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const vivaSchema = new Schema({

   transactionType: String,
   date: Date,
   description: String,
   amount: Number,
   iban: String,
   vivaAccountId: String,
   transactionId: String,
   asociat: {
        suplier: {
            type: Schema.Types.ObjectId,
            ref: 'Suplier'
        },
        nir: {
            type: Schema.Types.ObjectId,
            ref: 'Nir'
        }
   },
   locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
   },

   data: {
    type: Schema.Types.Mixed 
   }

})


module.exports = mongoose.model("Viva", vivaSchema);