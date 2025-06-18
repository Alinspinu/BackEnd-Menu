
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
    checkIn: {
       value: {
        type: Boolean,
        default: false,
       },
        date: Date
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
    cardIndex: { type: Schema.Types.Mixed },
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
        startDate: Date,
        endDate: Date,
        birthDate: Date,
        contract: {
            type: Boolean,
            default: false
        },
        active: {
            type: Boolean,
            index: true
        },
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
        releaseId:{
            type: String
        },
        releaseDate: {
            type: Date
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
        zodie: String,
        docs: [
            {
                name: String,
                filename: String,
                url: String
            }
        ],
        salary: {
            inHeand: {
                type: Number
            },
            onPaper: {
                salary: Number,
                tax: Number,
            },
            norm:{
                type: Number,
                default: 176
            },
            fix: Boolean,
        },
        payments: [
            {
                date: Date,
                amount: Number,
                tip: {
                        type: String,
                    },
                workMonth: Number,
                salePoint: {
                    type: Schema.Types.ObjectId,
                    ref: 'SalePoint'
                }
            
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
                medical: Boolean,
                freePayd: Boolean,
                salePoint: {
                    type: Schema.Types.ObjectId,
                    ref: 'SalePoint'
                }
            }
        ],
        salePoint: {
            type: Schema.Types.ObjectId,
            ref: 'SalePoint'
          }
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    otp: {
        code: String,
        date: Date
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
        ],
});



module.exports = mongoose.model('User', UserTrueSchema);





