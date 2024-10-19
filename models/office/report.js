const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require('../utils/counter')



const reportSchema = new Schema({

    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    index: {
        type: Number,
        index: true
    },
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
    diverse:{
        total: Number,
        entry: [
            {
                value: Number,
                reason: String,
                index: Number,
                date: Date,
            }
        ]
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
    serviceValue: {
        type: Number
    },
    marketingValue: {
        type: Number
    },
    inventarySpendings: {
        type: Number
    },
    gasValue:{
        type: Number
    },
    constructionsValue: {
        type: Number
    },
    rent: Number,
    utilities: Number,
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
                    updatedAt: Date,
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


reportSchema.pre("save", async function (next) {
    try {
      const doc = this;
      if(doc.index > 0){
      } else {
        const counter = await Counter.findOneAndUpdate(
          { locatie: this.locatie, model: "Report" },
          { $inc: { value: 1 } },
          { upsert: true, new: true }
        );
        doc.index = counter.value;
      }
      next();
    } catch (error) {
      next(error);
    }
  });






module.exports = mongoose.model('Report', reportSchema)