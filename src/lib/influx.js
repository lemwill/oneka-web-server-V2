const Influx = require('influx')

const influx = new Influx.InfluxDB({ 
    host: process.env.INFLUX_HOST,
    database: process.env.INFLUX_DB_NAME,
    username: process.env.INFLUX_USER,
    password: process.env.INFLUX_PASS,
});



module.exports = influx