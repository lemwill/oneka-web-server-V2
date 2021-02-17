const mongoose = require('mongoose');

const dataPointSchema = new mongoose.Schema({
  measurement: {type: String, required: true},
  field: {type: String, required: true},
});

const parameterSchema = new mongoose.Schema({
  name: {type: String, required: true},
  value: {type: Number, required: false},
  alias: {type: dataPointSchema, required: false},
});

const computedMeasurementSchema = new mongoose.Schema({
  buoyId: String,
  name: String,
  requiredPoints: {
    type: [dataPointSchema],
    required: true,
  },
  computationType: {
    type: String,
    enum: ['affine', 'multiply', 'affineTimesAffine'],
    default: 'affine',
  },
  parameters: {
    type: [parameterSchema],
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
