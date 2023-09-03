
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserTrueSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    admin: {
        type: Number,
        default: 0
    },
    cashBack: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
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