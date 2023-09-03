const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CounterSchema = new Schema({
  model: { type: String, required: true },
  value: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', CounterSchema);