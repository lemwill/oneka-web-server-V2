const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
  name: {type: String, required: true},
  value: {type: Number, required: true},
});

const computedMeasurementSchema = new mongoose.Schema({
  buoyId: String,
  name: String,
  measurement: {
    type: String,
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  computationType: {
    type: String,
    enum: [`affine`],
    default: `affine`,
  },
  parameters: {
    type: [parameterSchema],
    required: true,
  },
});

computedMeasurementSchema.index({
  'buoyId': 1,
  'name': 1,
},
{
  unique: true,
});

const ComputedMeasurement = mongoose.model('ComputedMeasurement', computedMeasurementSchema);

module.exports = ComputedMeasurement;
