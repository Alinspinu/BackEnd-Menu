const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require("../utils/counter");
const Ingredient = require('../office/inv-ingredient')
const Inventary = require('../office/inventary')
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
      invoiceName: {
        type: String
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
    const doc = this;
    const sup = await Suplier.findById(doc.suplier);

    const record = {
      typeOf: 'intrare',
      document: { typeOf: doc.document, docId: doc.nrDoc, amount: doc.totalDoc },
      sold: sup.sold,
      date: doc.documentDate,
      nir: doc._id 
    }

    if (sup) {
      sup.records.push(record);
      const sortedRecords = sup.records.sort((a,b)=>+new Date(a.date)-(+new Date(b.date)));
      const recordIndex = sortedRecords.findIndex(r=>r.nir.toString()===doc._id.toString());
      if (recordIndex !== -1) {
        for (let i = recordIndex; i < sortedRecords.length; i++) {
          sortedRecords[i].sold += doc.totalDoc;
        }
        sup.sold += doc.totalDoc;
        sup.records = sortedRecords;
        await sup.save();
      }
    }

    const counter = await Counter.findOneAndUpdate(
      { locatie: doc.locatie, model:"Nir", salePoint: doc.salePoint },
      { $inc: { value: 1 }},
      { upsert:true, new:true }
    );
    doc.index = counter.value;

    const operation = {
      name: 'intrare',
      details: sup.name + " Nr Doc - " + doc.nrDoc
    };

    const promises = doc.ingredients.map(async (el) => {
      const ingredient = await Ingredient.findById(el.ing);
      if (!ingredient) {
        console.error('Ingredient nu a fost gasit pentru id:', el.ing);
        return null;
      }
      console.log('Procesare..... ', ingredient.name)
      console.log('Cantitate (de intrare) document ', el.qty)

      // --- Build new invGestiune & uploadLog values fully in memory:
      let uploadLog = [
        ...ingredient.uploadLog,
        {
          date: doc.documentDate,
          qty: el.qty,
          operation,
          uploadPrice: roundd(el.price * (1 + el.tva / 100)),
          uploadNoVat: roundd(el.price),
          logId: el.logId,
          invoiceName: el.invoiceName,
          getiune: el.invGestiune
        }
      ];


      const inventary = await  Inventary
                                .findOne({date: {$gte: new Date(doc.documentDate)}, gestiune: el.invGestiune})
                                .sort({ date: 1 }); 

      if(inventary){
        inventary.scripticValue = roundd(Number(inventary.scripticValue + el.total) || el.total)
        console.log('AM gasit un inventar inregistrat dupa data documentului de intrare')
        console.log('Cautare ingredient in inventar...')
        const ing = inventary.ingredients.find(i => i.ing.toString() === el.ing.toString())
        if(ing){
          console.log('Ingredient gasit ', ing.name)
          console.log('Cantitate ingredient ', ing.scriptic, ing.um)
          console.log('Cantitate de adaugat ', el.qty, ing.um)
          ing.scriptic = roundd(ing.scriptic + el.qty)
          console.log('Cantitate modificata ', ing.scriptic)
          await inventary.save()
          console.log('Inventar modificat cu success!!')
        } else {console.warn('Nu am gasit ingredientul in inventar ',  el.ing.toString())}

      } 



      let invGestiune = ingredient.invGestiune;
      if (invGestiune.length) {
        const gestiuneMatch = el.invGestiune ? el.invGestiune.toString() : ingredient.gest.toString();
        const index = invGestiune.findIndex(g => g.gestiune.toString() === gestiuneMatch);
        if (index !== -1) {
          let ent = {
            qty: el.qty,
            inQty: el.qty,
            date: doc.documentDate || new Date(),
            priceNoVat: el.price,
            priceWithVat: roundd(el.price * (1 + el.tva / 100)),
            suplierNmae: sup.name,
            nir: doc._id
          };
          console.log('Cantitate gestiune (la intrare) inainte de modificari ', invGestiune[index].name, ' ',invGestiune[index].qty)
          if(invGestiune[index].qty <= 0){
            ent.qty = roundd(invGestiune[index].qty + ent.qty);
            invGestiune[index].entries = [];
          }
          invGestiune[index].entries.push(ent);
          let total=0;
          invGestiune[index].entries = invGestiune[index].entries.filter(e=> {
            if(e.qty < 0) return false;
            total += e.qty;
            console.log('Cantitate intrare de gestiune  ', invGestiune[index].name, ' ', e.qty)
            return true;
          });

          invGestiune[index].qty = roundd(total);
          console.log('Intrare adaugata cu succeess! Cantitate gestiune (la intrare) dupa modificari ', invGestiune[index].qty )
        }

      }
      // --- perform atomic update on Ingredient
      return Ingredient.updateOne(
        { _id: el.ing },
        {
          $set: {
            tva: el.tva,
            price: el.price,
            tvaPrice: ingredient.tvaPrice === 0 ? roundd(el.price * (1 + el.tva / 100)) : ingredient.tvaPrice,
            sellPrice: el.sellPrice,
            invGestiune: invGestiune,
            inventary: ingredient.inventary
          },
          $inc: { qty: el.qty },
          $push: { uploadLog: uploadLog[uploadLog.length - 1] }
        }
      );
    });

    await Promise.all(promises);

    next();
  } catch(error){
    next(error);
  }
});




nirSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      const doc = this;

      const promises = doc.ingredients.map(async (el) => {
        const ingredient = await Ingredient.findById(el.ing);
        if (!ingredient) {
          console.log('Ingredient not found:', el.ing);
          return null;
        }
        const inventary = await  Inventary
                            .findOne({date: {$gte: new Date(doc.documentDate)}, gestiune: el.invGestiune})
                            .sort({ date: 1 }); 
          if(inventary){
            inventary.scripticValue = roundd(Number(inventary.scripticValue - el.total) || el.total)
            console.log('AM gasit un inventar inregistrat dupa data documentului de iesire')
            console.log('Cautare ingredient in inventar...')
            const ing = inventary.ingredients.find(i => i.ing.toString() === el.ing.toString())
            if(ing){
            console.log('Ingredient gasit ', ing.name)
            console.log('Cantitate ingredient ', ing.scriptic, ing.um)
            console.log('Cantitate de scazut ', el.qty, ing.um)
            ing.scriptic = roundd(ing.scriptic - el.qty)
            console.log('Cantitate modificata ', ing.scriptic)
            await inventary.save()
            console.log('Inventar modificat cu success!!')
          } else {console.warn('Nu am gasit ingredientul in inventar ',  el.ing.toString())}

          } 

        // Build updated invGestiune entries in memory
        let invGestiune = ingredient.invGestiune;
        if (invGestiune.length) {
          const gestiuneMatch = el.invGestiune ? el.invGestiune.toString() : ingredient.gest.toString();
          const index = invGestiune.findIndex((g) => g.gestiune.toString() === gestiuneMatch);
          if (index !== -1) {
            console.log('Cantitate gestiune (la iesire) inainte de modificari ', invGestiune[index].qty)
            invGestiune[index].qty = roundd(invGestiune[index].qty - el.qty);
            invGestiune[index].entries = invGestiune[index].entries.filter(
              (log) => log?.nir?.toString() !== doc._id.toString()
            );
            console.log('Cantitate gestiune (la iesire) dupa modificari ', invGestiune[index].qty)
          }
        }
        return Ingredient.updateOne(
          { _id: el.ing },
          {
            $inc: { qty: -el.qty },
            $pull: { uploadLog: { logId: el.logId } },
            $set: { invGestiune: invGestiune, inventary: ingredient.inventary }
          }
        );
      });

      await Promise.all(promises);

      // Update supplier similarly
      const suplier = await Suplier.findById(doc.suplier);
      if (suplier) {
        const sortedRecords = suplier.records.sort((a, b) => +new Date(a.date) - +new Date(b.date));
        const recordIndex = sortedRecords.findIndex((r) => r.nir.toString() === doc._id.toString());
        if (recordIndex !== -1) {
          sortedRecords.splice(recordIndex, 1);
          for (let i = recordIndex; i < sortedRecords.length; i++) {
            sortedRecords[i].sold -= doc.totalDoc;
          }
          suplier.sold -= doc.totalDoc;
          suplier.records = sortedRecords;
          await suplier.save();
          console.log('Furnizorul a fost actualizat', suplier.name);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  }
);




module.exports = mongoose.model("Nir", nirSchema);