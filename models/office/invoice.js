const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Counter = require('../utils/counter')

const Client = require('../office/client')


const {unloadIngs, createProductSaleReport, uploadIngs} = require('../../utils/inventary');

const invoiceSchema = new Schema({
    invoice: {
        type: Boolean,
        default: true,
        required: true
    },
    unload: {
        type: Boolean,
        required: true
    },
    creditNoteRef: String,
    invoiceNumber: String,
    serie: String,
    index: {
        type: Number,
        index: true
    },
    issueDate: String,
    dueDate: String,
    currencyId: String,
    supplier: {
        name: String,
        vatNumber: String,
        iban: String,
        bank: String,
        vat: {
            type: String,
            default: 'VAT'
        },
        registration: String,
        legalForm: String,
        contact: {
            name: String,
            email: String,
            telephone: String
        },
        address: {
            postalCode: String,
            street: String,
            city: String,
            coutrySubentity: String,
            country: {
                type: String,
                default: 'RO'
            }
        },
    },
    client: {
        name: String,
        vatNumber: String,
        vat: {
            type: String,
            default: 'VAT'
        },
        registration: String,
        legalForm: String,
        contact: {
            name: String,
            email: String,
            telephone: String
        },
        address: {
            postalCode: String,
            street: String,
            city: String,
            coutrySubentity: String,
            country: {
                type: String,
                default: 'RO'
            }
        },
    },
    paymentMeans: {
        code: {
            type: Number,
            default: 42
        },
        serie: String,
        name: String,
        iban: String,
        swift: String,

    },
    products: [
        {
            name: String,
            quantity: Number,
            unitCode: String,
            price: Number,
            totalNoVat: Number,
            vatPrecent: Number,
            total: Number,
            productId: String,
            subProductId: String,
            ings: [
                {
                    qty: Number,
                    ing: {
                        type: Schema.Types.ObjectId,
                        ref: 'IngredientInv'
                    }
                }
            ],
            discount: {
                value: Number,
                reason: String,
                reasonCode: Number,
                precent: Number,
            }
        }
    ],
    discount: [
        {
        reasonCode: Number,
        reason: String,
        vat: Number,
        value: Number,
        precent: Number,
        baseAmount: Number,
        }
    ],
    vatAmount: Number,
    vatGroups: [
        {
            rate: Number,
            tax: Number,
            taxable: Number
        }
    ],
    taxExclusiveAmount: Number,
    taxInclusiveAmount: Number,
    payableAmount: Number,
    prePaydAmount:{
        type: Number,
        default: 0
    },
    eFacturaId: String,
    eFacturaStatus: String,
    eFacturaError: String,
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'Suplier'
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      }
}, {timestamps: true})




invoiceSchema.pre('save', async function (next){
  try{
    const doc = this
    const client = await Client.findById(doc.customer)

    const record = {
      typeOf: 'intrare',
      document: {
        typeOf: 'Factura',
        docId: doc.invoiceNumber,
        amount: doc.taxInclusiveAmount,
      },
      sold: client.sold,
      date: doc.issueDate,
      invoice: doc._id, 
      salePoint: doc.salePoint
    }
      if (client) {
        client.records.push(record)
        const sortedRecords = sup.records.sort((a, b) => {
          const aDate = new Date(a.date).getTime() 
          const bDate = new Date(b.date).getTime()
          return aDate - bDate
      })
          const recordIndex = sortedRecords.findIndex(r => r.invoice.toString() === doc._id.toString());
          if (recordIndex !== -1) {
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  sortedRecords[i].sold += doc.taxInclusiveAmount;
              }
              client.sold = client.sold + doc.taxInclusiveAmount
              client.records = sortedRecords
              await client.save();
              console.log("Client update:", client.name);
          } else {
            console.error('ERROR record not found, Client unchanged!')
          }

          console.log(client)
      }

    const counter = await Counter.findOneAndUpdate(
      { locatie: doc.locatie, model: "Invoice", salePoint: doc.salePoint },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    );
    doc.index = counter.value;


    if(doc.unload){
        for(let p of doc.products){
            await unloadIngs(p.ings, p.quantity)
        }
    }

    // const billProducts = doc.products.map(p => {
    //     const product = {
    //         name: p.name,
    //         productId: p.productId,
    //         subProductId: p.subProductId,
    //         discount: 0,
    //         price: p.price,
    //         quantity: p.quantity
    //     }
    //     return product
    // })

    // await createProductSaleReport(billProducts, new Date())


    next()
  } catch(error){
    next(error)
  }
})





invoiceSchema.pre('findOneAndDelete', async function(next){
  try{
    const doc = await this.model.findOne(this.getQuery());
    console.log('doc in pre delete', doc)

    const client = await Client.findById(doc.customer);

      if (client) {
        const sortedRecords = client.records.sort((a, b) => {
          const aDate = new Date(a.date).getTime() 
          const bDate = new Date(b.date).getTime()
          return aDate - bDate
      })
          const recordIndex = sortedRecords.findIndex(r => r.customer.toString() === doc._id.toString());
          if (recordIndex !== -1) {
              sortedRecords.splice(recordIndex, 1);
              for (let i = recordIndex; i < sortedRecords.length; i++) {
                  sortedRecords[i].sold -= doc.taxInclusiveAmount;
              }
              client.sold = client.sold - doc.taxInclusiveAmount
              client.records = sortedRecords
              await client.save();
              console.log('furnizorul a fos actualizat', client.name)
          } else {
            console.error('ERROR! Record not found! Suplier unchanged!')
          }

          console.log(client)
      }

      if(doc.unload){
          for(let p of doc.products){
            await uploadIngs(p.ings, p.quantity)
        }
      }


      const counter = await Counter.findOneAndUpdate( 
        { locatie: doc.locatie, model: "Invoice", salePoint: doc.salePoint },
        { $inc: { value: -1 } },
        { upsert: true, new: true }
    ).exec();

    doc.index = counter.value;


    next()
  } catch(error){
    next(error)
  }
})




module.exports = mongoose.model("Invoice", invoiceSchema);