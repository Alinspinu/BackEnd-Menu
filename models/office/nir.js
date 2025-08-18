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
  nirInvoice: {
    type: Schema.Types.ObjectId,
    ref: 'NirInvoice'
  },
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
      invGestiune: {
        type: Schema.Types.ObjectId,
        ref: 'Gestiune'
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
      sold: sup.sold,
      date: doc.documentDate,
      nir: doc._id 
    }
      if (sup) {
        sup.records.push(record)
        const sortedRecords = sup.records.sort((a, b) => {
          const aDate = new Date(a.date).getTime() 
          const bDate = new Date(b.date).getTime()
          return aDate - bDate
      })
          const recordIndex = sortedRecords.findIndex(r => r.nir.toString() === doc._id.toString());
          if (recordIndex !== -1) {
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  sortedRecords[i].sold += doc.totalDoc;
              }
              sup.sold = sup.sold + doc.totalDoc
              sup.records = sortedRecords
              await sup.save();
              console.log("Supplier update:", sup.name);
          } else {
            console.error('ERROR record not found, Sulier unchanged!')
          }
      }

    const counter = await Counter.findOneAndUpdate(
      { locatie: doc.locatie, model: "Nir", salePoint: doc.salePoint },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    );
    doc.index = counter.value;


    const operation = {
      name: 'intrare', 
      details: sup.name +  " Nr  Doc - " + doc.nrDoc
    };

    const promises = doc.ingredients.map(async (el) => {

    let ingredient = await Ingredient.findById(el.ing);
    if(!ingredient) {
      console.log('Ingredient nu a fost gasit pentru id:', el.ing);
      return null; 
    }
    ingredient.price = el.price;
    ingredient.tva = el.tva;
    ingredient.tvaPrice = roundd(el.price * (1 + el.tva / 100));
    ingredient.sellPrice = el.sellPrice;
    ingredient.qty = (ingredient.qty || 0) + el.qty;
  
    ingredient.uploadLog.push({
      date: doc.documentDate,
      qty: el.qty,
      operation: operation,
      uploadPrice: roundd(el.price * (1 + el.tva / 100)),
      logId: el.logId
    });

    if(ingredient.invGestiune.length){
    let gestiuneMatch = el.invGestiune ? el.invGestiune.toString() : ingredient.gest.toString()
    const index = ingredient.invGestiune.findIndex(g => g.gestiune.toString() === gestiuneMatch)
    if(index !== -1){
      let ent = {
        qty: el.qty,
        inQty: e.qty,
        date: new Date(),
        priceNoVat: el.price,
        priceWithVat: roundd(el.price * (1 + el.tva / 100)),
        suplierNmae: sup.name,
        nir: doc._id
      }
      if(ingredient.gestiune[index].qty <=0 ) {
        ent.qty = roundd(ingredient.gestiune[index].qty + ent.qty)
        ingredient.invGestiune[index].entries = []
      }
      ingredient.invGestiune[index].qty = roundd(ingredient.invGestiune[index].qty + ent.qty)
      ingredient.invGestiune[index].entries.push(ent)
      console.log('all good in the good ', ingredient.invGestiune[index])
    } else {console.log('Nu am gasit gestiunea ', gestiuneMatch, ingredient.invGestiune)}
  } else {console.log('ingredientul nu are gestiuni de inventar')}

    return ingredient.save();
  });
    
  const results = await Promise.all(promises);
    
    next()
  } catch(error){
    next(error)
  }
})



nirSchema.pre('deleteOne', { document: true, query: false }, async function(next){
  try{
    const doc = this

    const promises = doc.ingredients.map(async el => {
      const ingredient = await Ingredient.findById(el.ing);
      if (!ingredient) {
        console.log('Ingredient not found:', el.ing);
        return null;
      }
    
      // decrement qty
      ingredient.qty = (ingredient.qty || 0) - el.qty;
    
      // remove from uploadLog by logId
      ingredient.uploadLog = ingredient.uploadLog.filter(log => {
        return log.logId.toString() !== el.logId.toString();
      });


      if(ingredient.invGestiune.length){
        let gestiuneMatch = el.invGestiune ? el.invGestiune.toString() : ingredient.gest.toString()
        const index = ingredient.invGestiune.findIndex(g => g.gestiune.toString() === gestiuneMatch)
        if(index !== -1){
          ingredient.invGestiune[index].qty = roundd(ingredient.invGestiune[index].qty - el.qty)
          ingredient.invGestiune[index].entries = ingredient.invGestiune[index].entries.filter(log => {
            return log.nir.toString() !== doc._id.toString();
          });
    
          console.log('all good in the good ', ingredient.invGestiune[index])
        } else {console.log('Nu am gasit gestiunea ', gestiuneMatch, ingredient.invGestiune)}
      } else {console.log('ingredientul nu are gestiuni de inventar')}

    
      return ingredient.save();
    });
    
    const results = await Promise.all(promises);
    
    const suplier = await Suplier.findById(doc.suplier);

      if (suplier) {
        const sortedRecords = suplier.records.sort((a, b) => {
          const aDate = new Date(a.date).getTime() 
          const bDate = new Date(b.date).getTime()
          return aDate - bDate
      })
          const recordIndex = sortedRecords.findIndex(r => r.nir.toString() === doc._id.toString());
          if (recordIndex !== -1) {
              sortedRecords.splice(recordIndex, 1);
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  sortedRecords[i].sold -= doc.totalDoc;
              }
              suplier.sold = suplier.sold - doc.totalDoc
              suplier.records = sortedRecords
              await suplier.save();
              console.log('furnizorul a fos actualizat', suplier.name)
          } else {
            console.error('ERROR! Record not found! Suplier unchanged!')
          }
      }


    next()
  } catch(error){
    next(error)
  }
})

module.exports = mongoose.model("Nir", nirSchema);