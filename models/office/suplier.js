const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const suplierSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  vatNumber: {
    type: String,
    required: true,
  },
  register: {
    type: String, 
    required: true
  },
  account: {
    type: String,
  },
  bank: {
    type: String,
  },
  address: {
    type: String,
    required: true
  },
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
  },
  sold: {
    type: Number,
    default: 0
  },
  records: [
    {
      typeOf: {
        type: String,
        enum: ['intrare', 'iesire']
      },
      document: {
        typeOf: {
          type: String,
        },
        docId: {
          type: String,
        },
        amount: {
          type: Number
        }
      },
      description: {
        type: String
      },
      nir: {
        type: Schema.Types.ObjectId,
        ref: 'Nir'
      },
      date: {
        type: Date
      }
    }
  ]

});

module.exports = mongoose.model("Suplier", suplierSchema);