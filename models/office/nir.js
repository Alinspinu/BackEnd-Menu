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
    const sup = await Suplier.findById(doc.suplier)

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

    // const suplier = await Suplier.findByIdAndUpdate(
    //   doc.suplier,  
    //   { 
    //       $push: { records: record },
    //       $inc: { sold: doc.totalDoc } 
    //   },
    //   { new: true, useFindAndModify: false }
    // )


      if (sup) {
        sup.records.push(record)
        const sortedRecords = sup.records.sort((a, b) => {
          const aDate = new Date(a.date).getTime() 
          const bDate = new Date(b.date).getTime()
          return aDate - bDate
      })
          const recordIndex = sortedRecords.findIndex(r => r.nir.toString() === doc._id.toString());
          console.log('Rcord index nir save schema', recordIndex)
          if (recordIndex !== -1) {
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  console.log('recodrd after', sortedRecords[i].sold)
                  sortedRecords[i].sold += doc.totalDoc;
                  console.log('recodrd before', sortedRecords[i].sold)
              }
              sup.sold = sup.sold + doc.totalDoc
              sup.records = sortedRecords
              await sup.save();
          }
      }



    console.log("Supplier update:", sup.name);

    const counter = await Counter.findOneAndUpdate(
      { locatie: doc.locatie, model: "Nir" },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    );
    doc.index = counter.value;


    const operation = {
      name: 'intrare', 
      details: sup.name +  " Nr  Doc - " + doc.nrDoc
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

    const suplier = await Suplier.findById(doc.suplier);

      if (suplier) {
        const sortedRecords = suplier.records.sort((a, b) => {
          const aDate = new Date(a.date).getTime() 
          const bDate = new Date(b.date).getTime()
          return aDate - bDate
      })
          const recordIndex = sortedRecords.findIndex(r => r.nir.toString() === doc._id.toString());
          console.log('Rcord index  nir delete schema', recordIndex)
          if (recordIndex !== -1) {
            const record = sortedRecords[recordIndex]
            const paymentRecordIndex = sortedRecords.findIndex(r => r.typeOf === 'iesire' && r.document.amount === record.document.amount && r.document.typeOf === "banca")
            if(paymentRecordIndex !== -1) sortedRecords.splice(paymentRecordIndex, 1)
              sortedRecords.splice(recordIndex, 1);
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  console.log('recodrd after', sortedRecords[i].sold)
                  sortedRecords[i].sold -= doc.totalDoc;
                  console.log('recodrd before', sortedRecords[i].sold)
              }
              suplier.sold = suplier.sold - doc.totalDoc
              suplier.records = sortedRecords
              await suplier.save();
          }
      }

       console.log('furnizorul a fos actualizat', suplier.name)
    // }


    next()
  } catch(error){
    next(error)
  }
})

module.exports = mongoose.model("Nir", nirSchema);