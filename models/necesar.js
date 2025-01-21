const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const necesarSchema = new Schema({
    date: {
        type: Date
    },
    status: {
        type: String
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    section: String,
    goods: [
        {
            name: String,
            qty: Number,
            date: Date,

            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ]
})


module.exports = mongoose.model("Necesar", necesarSchema);