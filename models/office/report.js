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
    period: String,
    day: {
        type: Date,
        index: true
    },
    endDay: {
        type: Date,
        index: true
    },
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
    rent: {
        type: Number
    },
    totalSpendings: Number,
    totalGestIncome: Number,
    profit: Number,
    spendingsDeps: [
        {
            total: Number,
            name: String,
            dep: {
                type: Schema.Types.ObjectId,
                ref: 'Dep'
            },
            entries: [
                {
                    date: Date,
                    name: String,
                    qty: Number,
                    price: Number,
                    suplier: String,
                    logId: String,
                    invoiceName: String,
                    gestiune:  {
                        type: Schema.Types.ObjectId,
                        ref: 'Gestiune'
                      }
                }
            ]
        }
    ],

    // inGest: [
    //     {
    //         name: String,
    //         total: Number,
    //         marfa: Number,
    //         materie: Number,
    //         gest: {
    //             type: Schema.Types.ObjectId,
    //             ref: 'Gestiune'
    //         }
    //     }
    // ],

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
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    supliesProdBuc: Number,
    supliesMfBuc: Number,
    supliesProdBar: Number,
    supliesMfBar: Number,
    serviceValue: {
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    marketingValue: {
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    inventarySpendings: {
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    gasValue:{
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    constructionsValue: {
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    rent: {
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    utilities: {
        total: Number,
        entries: [
            {
                date: Date,
                name: String,
                qty: Number,
                price: Number,
                suplier: String,
                logId: String,
                invoiceName: String,
                gestiune:  {
                    type: Schema.Types.ObjectId,
                    ref: 'Gestiune'
                  }
            }
        ]
    },
    departaments: [
        {
            totalIn: Number,
            totalOut: Number,
            // procentIn: Number,
            // procentOut: Number,
            id: String,
            name: String,
            dep: [
                {
                    name: String,
                    totalInvIn: Number,
                    totalInvOut: Number,
                    totalIn: Number,
                    totalOut: Number,
                    totalRecipes: Number,
                    depId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Dep'
                    },
                    // procentIn: Number,
                    // procentOut: Number
                }
            ],
            products: [
                {
                    name: String,
                    qty: Number,
                    dep: String,
                    depId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Dep'
                    },
                    price: Number,
                    totalRecipe: Number,
                }
            ],
            entries: [
                {
                    date: Date,
                    name: String,
                    qty: Number,
                    price: Number,
                    suplier: String,
                    logId: String,
                    invoiceName: String,
                    dep: {
                        type: Schema.Types.ObjectId,
                        ref: 'Dep'
                    },
                    gestiune:  {
                        type: Schema.Types.ObjectId,
                        ref: 'Gestiune'
                      }
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
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      },

    reports: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Report'
        }
    ]
})


reportSchema.pre("save", async function (next) {
    try {
      const doc = this;
      if(doc.index > 0){
      } else {
        const counter = await Counter.findOneAndUpdate(
          { locatie: this.locatie, model: "Report", salePoint: this.salePoint },
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