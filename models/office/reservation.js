const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const reservationSchema = new Schema({

    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie',
        index: true
    },
    client: {
        telephone: {
            type: String,
            index: true,
            required: true,
        },
        name: {
            type: String,
            required: true
        },
        client: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    date: Date,
    guests: Number,
    position: String,
    details: String,
    notified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['new', 'accepted', 'canceled', 'done']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }

}, {timestamps: true})


module.exports = mongoose.model("Reservation", reservationSchema);