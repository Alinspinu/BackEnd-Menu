
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserTrueSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    telephone: {
        type: String
    },
    admin: {
        type: Number,
        default: 0
    },
    cashBack: {
        type: Number,
        default: 0
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    survey: String,
    firstCart: String,
    orders:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'OrderTrue'
            }
        ]
});



module.exports = mongoose.model('UserTrue', UserTrueSchema);