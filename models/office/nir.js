const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require("../utils/counter");

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
  type: {
    type: String,
    default: 'unpayd',
    enum: ['bank', 'cash', 'unpayd'],
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
    },
  ],
}, { timestamps: true, });

nirSchema.pre("save", async function (next) {
  try {
    const doc = this;
    if(doc.index > 0){

    } else {
      const counter = await Counter.findOneAndUpdate(
        { locatie: this.locatie, model: "Nir" },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      doc.index = counter.value;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Nir", nirSchema);