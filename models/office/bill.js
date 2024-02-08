const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require("../utils/counter")




const billSchema = new Schema({
    serie: String,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    client: {
        type: Schema.Types.ObjectId,
        ref: 'Suplier'
    },
    index: {
        type: Number,
        index: true
    },
    products: [
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
            discount: Number,
            mainCat: String,
            imgPath: String,
            payToGo: Boolean,
            dep: String,
            sub: Boolean,
            qty: String,
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
            comment: String,
            tva: Number,
        }
    ]


},{ timestamps: true, })
 


billSchema.pre("save", async function (next) {
    try {
      const doc = this;
      const counter = await Counter.findOneAndUpdate(
        { locatie: this.locatie, model: "Bill" },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      doc.index = counter.value;
      next();
    } catch (error) {
      next(error);
    }
  });


module.exports = mongoose.model('Bill', billSchema);