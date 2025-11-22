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
        email: {
            type: String
        },
        client: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    date: Date,
    dateString: String,
    guests: Number,
    position: String,
    details: String,
    notified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['new', 'accepted', 'canceled', 'pending',  'done']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      },

    resHour: {
        type: Schema.Types.ObjectId,
        ref: 'ResHour'
    }

}, {timestamps: true})


module.exports = mongoose.model("Reservation", reservationSchema);