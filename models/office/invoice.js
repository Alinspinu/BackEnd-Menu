const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Counter = require('../utils/counter')

const invoiceSchema = new Schema({
    invoice: {
        type: Boolean,
        default: true,
        required: true
    },
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


invoiceSchema.pre("save", async function (next) {
    try {
        const doc = this;
            const counter = await Counter.findOneAndUpdate( 
                { locatie: this.locatie, model: "Invoice", salePoint: this.salePoint },
                { $inc: { value: 1 } },
                { upsert: true, new: true }
            ).exec();
            if(counter){
                doc.index = counter.value;
                if(!doc.invoiceNumber){
                    doc.invoiceNumber = `${doc.serie} nr. ${doc.index}`
                    doc.paymentMeans.serie = `${doc.serie} nr. ${doc.index}`
                } else {
                    doc.paymentMeans.serie = doc.invoiceNumber
                }
            }else {
                const newCounter = new Counter({
                    locatie: doc.locatie,
                    salePoint: doc.salePoint,
                    model: 'Invoice',
                    value: 1
                })
                await newCounter.save()
                doc.index = 1
                if(!doc.invoiceNumber){
                    doc.invoiceNumber = `${doc.serie} nr. ${doc.index}`
                    doc.paymentMeans.serie = `${doc.serie} nr. ${doc.index}`
                } else {
                    doc.paymentMeans.serie = doc.invoiceNumber
                }
            }
            next();
    } catch (error) {
        next(error);
    }
});

invoiceSchema.pre('findOneAndDelete', async function(next) {
    try{
        const doc = await this.model.findOne(this.getQuery());
        if(doc) {
            const counter = await Counter.findOneAndUpdate( 
                { locatie: doc.locatie, model: "Invoice", salePoint: doc.salePoint },
                { $inc: { value: -1 } },
                { upsert: true, new: true }
            ).exec();
            console.log(counter)
        }
        next();
    } catch(error) {
        next(error)
    }
  });


module.exports = mongoose.model("Invoice", invoiceSchema);