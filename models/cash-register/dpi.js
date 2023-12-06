const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const dpiSchema = new Schema({
    entry: {
        type: Schema.Types.ObjectId,
        ref: 'Entry'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('Dpi', dpiSchema)