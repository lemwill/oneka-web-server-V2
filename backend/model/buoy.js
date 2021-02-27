const mongoose = require('mongoose');

const buoySchema = new mongoose.Schema({
  hardwareID: {type: 'string', required: true},
});

const Buoy = mongoose.model('Buoy', buoySchema);

module.exports = Buoy;
