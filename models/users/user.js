
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
    cashBackProcent: {
        type: Number,
        default: 5
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    cardIndex: String,
    discount: {
        general: {
            type: Number,
            default: 0
        },
        category: [
            {
                precent: {
                    type: Number,
                    default: 0
                },
                name: String,
                cat:{
                        type: Schema.Types.ObjectId,
                        ref: 'Category'
                    }
                    
            }
        ]
    },
    employee: {
        fullName: {
            type: String,
        },
        cnp: {
            type: Number,
        },
        ciSerial: {
            type: String,
        },
        ciNumber: {
            type: Number,
        },
        address: {
            type: String,
        },
        position: {
            type: String, 
        },
        access: {
            type: Number,
        }
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
                ref: 'Order'
            }
        ]
});



module.exports = mongoose.model('User', UserTrueSchema);