const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const vivaSchema = new Schema({

    data: Schema.Types.Mixed

})


module.exports = mongoose.model("Viva", vivaSchema);