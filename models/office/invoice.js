const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Counter = require('../utils/counter')

const invoiceSchema = new Schema({
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
            street: String,
            city: String,
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
            street: String,
            city: String,
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
        precent: Number
        }
    ],
    vatAmount: Number,
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
                doc.invoiceNumber = `${doc.serie} nr. ${doc.index}`
                doc.paymentMeans.serie = `${doc.serie} nr. ${doc.index}`
            }else {
                const newCounter = new Counter({
                    locatie: doc.locatie,
                    salePoint: doc.salePoint,
                    model: 'Invoice',
                    value: 1
                })
                await newCounter.save()
                doc.index = 1
                doc.invoiceNumber = `${doc.serie} nr. 1`
                doc.paymentMeans.serie = `${doc.serie} nr. 1`
            }
            next();
    } catch (error) {
        next(error);
    }
});


module.exports = mongoose.model("Invoice", invoiceSchema);