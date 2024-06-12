const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const reportSchema = new Schema({

    day: Date,

    cashIn: {
        type: Number,
        required: true
    },
    cashInNoVat: {
        type: Number,
        required: true
    },
    vatValue: {
        type: Number,
        required: true
    },
    ingsValue: {
        type: Number,
        required: true
    },
    rentValue: {
        type: Number,
        required: true 
    },
    impairment: 
        {
            total: Number,
            products: [
                {
                    name: String,
                    cost: Number,
                    qty: Number,
                }
            ]
        },
    workValue:
        {
            total: Number,
            tax: Number,
            users: [
                {
                    name: String,
                    hours: Number,
                    position: String,
                    monthHours: Number,
                    baseIncome: Number,
                    baseTax: Number,
                    hourIncome: Number,
                    totalIncome: Number,
                    taxValue: Number,
                    bonus: Number,
                    user: {
                        type: Schema.Types.ObjectId,
                        ref: 'User'
                    }

                }
            ]
        },
    supliesValue: {
        type: Number,
        required: true
    },
    departaments: [
        {
            total: Number,
            procent: Number,
            name: String,
            products: [
                {
                    name: String,
                    qty: Number,
                    dep: String,
                    price: Number,
                }
            ]
        }
    ],
    paymentMethods: [
        {
            name: String,
            value: Number,
            procent: Number,
            bills: [
                {
                    index: {
                        type: Number,
                        index: true
                    },
                    masa: {
                        type: Number
                    },
                    tips: {
                        type: Number,
                        default: 0
                    },
                    total: {
                        type: Number,
                        required: true
                    },
                    discount: {
                        type: Number,
                        default: 0
                    },
                    voucher:{
                        type: Number,
                        default: 0
                    },
                    cashBack: {
                        type: Number,
                        default: 0
                    },
                    paymentMethod: String,
                    clientInfo: {
                        name: String,
                    },
                    employee:{
                      fullName: String,
                    },
                    createdAt: Date,
                    products:
                        [
                            {
                                name: {
                                    type: String,
                                    required: true
                                },
                                discount: Number,
                                quantity: {
                                    type: Number,
                                    required: true
                                },
                                price: {
                                    type: Number,
                                    required: true
                                },
                                total: {
                                    type: String,
                                    required: true
                                },
                                imgUrl: {
                                    type: String,
                                    default: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1692369756/True/no_image_patrat_pt8iod.png'
                                },
                            }
                        ]
                }
            ]
        }
    ],
    hours: [
        {
            hour: Number,
            procent: Number,
            total: Number
        }
    ],
    users: [
        {
            name: String,
            procent: Number,
            total: Number,
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
})






module.exports = mongoose.model('Report', reportSchema)