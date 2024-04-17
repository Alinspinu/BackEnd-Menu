
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
    cardIndex: Number,
    cardName: String,
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
        },
        salary: {
            inHeand: {
                type: Number
            },
            onPaper: {
                salary: Number,
                tax: Number,
            }
        },
        workLog: [
            {
                day: Date,
                checkIn: String,
                chekOut: String,
                hours: Number,
                earnd: Number,
                comments: [
                    {
                    user: {
                        type: Schema.Types.ObjectId,
                        ref: 'User'
                    },
                    comment: String,
                    type: {
                        type: String,
                        enum: ['positive', 'negative']
                    }
                    },
                ],
            }
        ],
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    hobbies: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    admin: {
        type: Number,
        default: 0
    },
    profilePic: {
        type: String,
        default: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1681544380/gossips/jee-75-512_msbpdw.webp'
    },
    gossips:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Gossip'
            }
        ],
    comments:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment'
            }
        ],
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