
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
        active: Boolean,
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
            },
            fix: Boolean,
        },
        payments: [
            {
                date: Date,
                amount: Number,
                tip: {
                        type: String,
                        enum: ['Avans', 'Salariu', 'Bonus vanzari', 'Bonus excelenta', 'Plata catre administrator']
                    },
                workMonth: Number
            
            }
        ], 
        workLog: [
            {
                day: Date,
                checkIn: Date,
                checkOut: Date,
                hours: Number,
                earnd: Number,
                position: String,
                concediu: Boolean,
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