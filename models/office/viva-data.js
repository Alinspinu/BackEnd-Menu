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
    type: Boolean,
    default: false
   },
   locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
   }

})


module.exports = mongoose.model("Viva", vivaSchema);