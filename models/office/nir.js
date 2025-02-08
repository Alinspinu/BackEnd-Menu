const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require("../utils/counter");
const Ingredient = require('../office/inv-ingredient')
const Suplier = require('../office/suplier')
const {roundd } = require('../../utils/functions')

const nirSchema = new Schema({
  suplier: { 
    type: Schema.Types.ObjectId,
    ref: "Suplier",
  },
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
  },
  nrDoc: {
    type: String,
    required: true,
  },
  index: {
    type: Number,
    index: true,
  },
  documentDate: {
    type: Date,
    required: true
  },
  receptionDate: {
    type: Date
  },
  totalDoc: {
    type: Number
  },
  payd: {
    type: Boolean,
    default: false
  },
  val: {
    type: Number
  },
  valTva: {
    type: Number
  },
  valVanzare: {
    type: Number
  },
  type: {
    type: String,
    default: 'unpayd',
  
  },
  selected: {
    type: Boolean,
    defaulr: false
  },
  document: {
    type: String
  },
  discount: [
    {
      tva: Number,
      value: Number,
      procent: Number,
    }
  ],
  eFacturaId: String,
  ingredients: [
    {
      name: {
        type: String,
        required: true,
      },
      um: {
        type: String,
        required: true,
      },
      qty: {
        type: Number,
        required: true,
      },
      dep: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      value: {
        type: Number,
        default: 0
      },
      gestiune: {
        type: String,
        default: "magazie",
      },
      tva: {
        type: Number,
        default: 0
      },
      tvaValue: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        required: true,
      },
      sellPrice: {
        type: Number,
        default: 0,
      },
      logId: String,
      ing: {
        type: Schema.Types.ObjectId,
        ref: 'IngredientInv'
      }
    },
  ],
  salePoint: {
    type: Schema.Types.ObjectId,
    ref: 'SalePoint'
  }
}, { timestamps: true, });



nirSchema.pre('save', async function (next){
  try{
    const doc = this

    const record = {
      typeOf: 'intrare',
      document: {
        typeOf: doc.document,
        docId: doc.nrDoc,
        amount: doc.totalDoc,
      },
      date: doc.documentDate,
      nir: doc._id 
    }

    const suplier = await Suplier.findByIdAndUpdate(
      doc.suplier,  
      { 
          $push: { records: record },
          $inc: { sold: doc.totalDoc } 
      },
      { new: true, useFindAndModify: false }
    )

    console.log("Supplier update:", suplier.name);

    const counter = await Counter.findOneAndUpdate(
      { locatie: doc.locatie, model: "Nir" },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    );
    doc.index = counter.value;


    const operation = {
      name: 'intrare', 
      details: suplier.name +  " Nr  Doc - " + doc.nrDoc
    };

    const promises = doc.ingredients.map((el) => {
      return Ingredient.findByIdAndUpdate(
        el.ing,
        {
          $setOnInsert: {
            um: el.um,
            locatie: doc.locatie,
          },
          $set: {
            price: el.price,
            tva: el.tva,
            tvaPrice: roundd(el.price * (1 + el.tva / 100)),
            sellPrice: el.sellPrice
          },
          $inc: {qty: el.qty},
          $push: {
            uploadLog: {
              date: doc.documentDate,
              qty: el.qty,
              operation: operation,
              uploadPrice: roundd(el.price * (1 + el.tva / 100)),
              logId: el.logId
            }
          }
        },
        { upsert: true, new: true }
      ).exec();
    });

    const results = await Promise.all(promises)

    next()
  } catch(error){
    next(error)
  }
})





nirSchema.pre('deleteOne', { document: true, query: false }, async function(next){
  try{
    const doc = this
    const promises = doc.ingredients.map(el => {
      return Ingredient.findByIdAndUpdate(
        el.ing,
        {
          $inc: {qty: -el.qty},
          $pull: {
            uploadLog: {
              logId: el.logId,
            }
          }
        },
        {new: true}
      ).exec()
    })

    const results = await Promise.all(promises)

    // if(doc.suplier){

      const suplier =  await Suplier.findByIdAndUpdate(
         doc.suplier,
         { 
             $pull: { records: { nir: doc._id } },
             $inc: { sold: - doc.totalDoc }
         },
         { new: true, useFindAndModify: false }
       )
       console.log('furnizorul a fos actualizat', suplier.name)
    // }


    next()
  } catch(error){
    next(error)
  }
})

module.exports = mongoose.model("Nir", nirSchema);