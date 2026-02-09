const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require('../utils/counter')



const orderSheetSchema = new Schema({

        index: {
            type: Number,
            index: true
        },
        suplier: {
            locatie: {
                type: Schema.Types.ObjectId,
                ref: 'Locatie'
            },
            salePoint: {
                type: Schema.Types.ObjectId,
                ref: 'SalePoint'
            },
        },
        customer: {
            locatie: {
                type: Schema.Types.ObjectId,
                ref: 'Locatie'
            },
            salePoint: {
                type: Schema.Types.ObjectId,
                ref: 'SalePoint'
            },
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        },

        notification: {
            sent: Boolean,
            recived: Boolean
        },

        updates: [
            {
                time: Date,
                user: String
            }
        ],


        products: [
            {
                name: String,
                quantity: Number,
                um: String,
                status: {
                    sent: {
                        value: Boolean,
                        user: String,
                        quantity: Number,
                    },
                    recived: {
                        value: Boolean,
                        user: String,
                        quantity: Number,
                    },

                },
                details: String,
                ing: {
                    type: Schema.Types.ObjectId,
                    ref: 'IngredientInv'
                },
                pName: String,
                pPrice: Number,
                pUm: String,
                pQty: Number,
                
            }
        ],
        comment: String,
        createdAt: Date,
        orderDate: Date,

})


orderSheetSchema.pre('save', async function (next) {
    try {
      if (!this.isNew) {
        return next();
      }
  
      const counter = await Counter.findOneAndUpdate(
        {
          locatie: this.customer.locatie,
          model: "OrderSheet",
          salePoint: this.customer.salePoint
        },
        {
          $inc: { value: 1 }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
  
      this.index = counter.value;
  
      next();
    } catch (err) {
      console.error('Eroare rezervare pre-save hook:', err);
      next(err);
    }
  });

module.exports = mongoose.model('OrderSheet', orderSheetSchema)