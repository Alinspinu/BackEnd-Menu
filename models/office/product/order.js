
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Counter = require('../../utils/counter')
const Table = require('../../utils/table')

const orderTrueSchema = new Schema({
    index: {
        type: Number,
        index: true
    },
    dayCounter: {
        type: Number,
        index: true
    },
    soketId: {
        type: String,
        index: true
    },
    name: {
        type: String,
        default: 'COMANDA'
    },
    masaRest: {
        type: Schema.Types.ObjectId,
        ref: 'Table'
    },
    production: Boolean,
    masa: {
        type: Number
    },
    productCount: {
        type: Number,
        required: true
    },
    tips: {
        type: Number,
        default: 0
    },
    pending: {
        type: Boolean,
        default: true
    },
    totalProducts: {
        type: Number,
        required: true
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

    inOrOut: String,
    status: {
        type: String,
        default: "open",
        index: true
    },
    toGo: {
        type: Boolean,
        default: false
    },
    pickUp: {
        type: Boolean,
        default: false
    },
    completetime: {
        type: Number,
        default: 0
    },
    endTime: {
        type: String
    },
    cashBack: {
        type: Number,
        default: 0
    },
    payOnSite: {
        type: Boolean,
        default: false
    },
    onlineOrder: {
        type: Boolean,
    },
    preOrder: {
        type: Boolean,
        default: false
    },
    preOrderPickUpDate: {
        type: String,
    },
    payOnline: {
        type: Boolean,
        default: false
    },
    prepStatus: {
        type: String,
        default: 'open'
    },
    out: {
        type: Boolean,
        default: false
    },
    dont: Boolean,
    paymentMethod: String,
    payment: {
        cash: Number,
        card: Number,
        viva: Number,
        online: Number,
    },
    cif: String,
    clientInfo: {
        name: String,
        email: String,
        telephone: String,
        userId: String,
        cashBack: Number,
        discount: {
            general: Number,
            category: [
                {
                    precent: Number,
                    cat: String,
                    name: String,
                }
            ]
        }
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie',
        index: true
    },
    employee:{
      fullName: {
        type: String,
      },
      position: String,
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    },
    monitors: [
        {
            section: {
                type: Schema.Types.ObjectId,
                ref: 'Section'
            },
            prep: {
                type: Boolean,
                default: true
            },
            pending: {
                type: Boolean,
                default: true
            },
            products: [
                {
                    name: String,
                    qty: Number,
                    toppings: [
                        {
                            name: String,
                            qty: Number,
                        }
                    ],
                    comment: String
                }
            ]
        }
    ],
    products:
        [
            {
                name: {
                    type: String,
                    required: true
                },
                category: String,
                printer: {
                    type: String, 
                    default: 'main'
                },
                sentToPrint: {
                    type: Boolean,
                },
                sentToPrintOnline: {
                    type: Boolean,
                    default: true
                },
                sgrTax: {
                    type: Boolean,
                    default: false
                },
                subProductId: {
                    type: String
                },
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product'
                },
                printOut: Boolean,
                discount: Number,
                mainCat: String,
                imgPath: String,
                payToGo: Boolean,
                dep: String,
                // dep: {
                //     type: Schema.Types.ObjectId,
                //     ref: 'Dep'
                // },
                printSection: {
                    type: Schema.Types.ObjectId,
                    ref: 'Section'
                },
                sub: Boolean,
                qty: String,
                section: String,
                description: String,
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
                toppings: [
                    {
                        name: String,
                        price: Number,
                        qty: Number,
                        um: String,
                        ingPrice: Number,
                        ing: {
                            type: Schema.Types.ObjectId,
                            ref: 'IngredientInv'
                        }
                    }
                ],
                ings: [
                    {
                        qty: {
                          type: Number,
                        },
                        ing: {
                            type: Schema.Types.ObjectId,
                            ref: 'IngredientInv'
                        }
                      },
                ],
                energy: Number,
                comment: String,
                tva: Number,
            }
        ],
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
        }


}, { timestamps: true, })

orderTrueSchema.index({ createdAt: 1 })
orderTrueSchema.index({ updatedAt: 1 })

orderTrueSchema.pre("save", async function (next) {
    try {
        const doc = this;
            const counter = await Counter.findOneAndUpdate( 
                { locatie: this.locatie, model: "Order", salePoint: this.salePoint },
                { $inc: { value: 1 } },
                { upsert: true, new: true }
            ).exec();
    
            doc.index = counter.value;

            const dayCounter = await Counter.findOneAndUpdate(
                { locatie: this.locatie, model: "DayOrder", salePoint: this.salePoint },
                { $inc: { value: 1 } },
                { upsert: true, new: true }
            ).exec()
            
            if(dayCounter){
                doc.dayCounter = dayCounter.value
            } else {
                const c = new Counter({locatie: this.locatie, salePoint: this.salePoint, model: 'DayOrder', value: 1})
                const sc = await c.save()
                doc.dayCounter = sc.value
            }

            next();
    } catch (error) {
        next(error);
    }
});

orderTrueSchema.post('save', async function (doc, next) {
    try {
        if(doc.soketId){

            const duplicates = await mongoose.model('Order').find({ soketId: doc.soketId });
            console.log('duplicate orders', duplicates.length)
            if (duplicates.length > 1) {
            
              const idsToDelete = duplicates.slice(1).map(d => d._id);
              await mongoose.model('Order').deleteMany({ _id: { $in: idsToDelete } });
              console.log(`Deleted ${idsToDelete.length} duplicate document(s) for soketId: ${doc.soketId}`);
            }
        }
        next(); 
  
    } catch (err) {
      console.error('Error in post save hook:', err);
      next(err); // Pass error to next middleware or error handler
    }
  });


orderTrueSchema.pre('deleteOne', async function (next){
    await Table.findByIdAndUpdate(this.masaRest , { $pull: { bills: this._id } }).exec()
    next()
})

module.exports = mongoose.model('Order', orderTrueSchema)

