const Influx = require('../lib/influx');
const { load } = require('protobufjs');
const _ = require('lodash');

class DaqMessage{
    constructor() {
        this.influx = Influx;
        this.db_name = 'daq_oneka_v3';
    }

    async start() {
        const names = await this.influx.getDatabaseNames();
        if (!names.includes(this.db_name)){
            try {
                await this.influx.createDatabase(this.db_name)
            } catch (err) {
                console.error(`Unable to crate db ${err}`)
            }
        } 
    }

    async writePoints(points) {
        await this.influx.writeMeasurement('buoy_data', points);
    }


    async addPoint(){

    }

    async writeMessage(message) {
        const root = await load('./spec/daqmessage.proto');
        const deserializer = root.lookupType("DaqMessage");
        const errMsg = deserializer.verify(message);
        
        if (errMsg) {
            throw new Error(errMsg);
        } else {
            const deserializedMessage = deserializer.decodeDelimited(message);
            const boardId = deserializedMessage.boardId;

            let points = [];

            
            for (let i = 0; i < deserializedMessage.samples.length; i++) {

                //console.log(deserializedMessage.samples[i])
                let timestamp = deserializedMessage.samples[i].ntpTimestamp;



                let powerSupplyVoltage_mV = deserializedMessage.samples[i].powerSupplyVoltageMV
                if (powerSupplyVoltage_mV != 0) {
                    console.log(powerSupplyVoltage_mV)
                    points.push({
                        tags:{
                            board_id: boardId,
                            sensor: 'powerSupplyVoltage_mV',
                        },
                        fields: {
                            value: powerSupplyVoltage_mV,
                            time: timestamp
                        }
                    })
                }

                let powerSupplyCurrent_mA = deserializedMessage.samples[i].powerSupplyCurrentMA
                if (powerSupplyCurrent_mA != 0) {
                    points.push({
                        tags:{
                            board_id: boardId,
                            sensor: 'powerSupplyCurrent_mA',
                        },
                        fields: {
                            value: powerSupplyCurrent_mA,
                            time: timestamp
                        }
                    })
                }

                let chargeVoltage_mV = deserializedMessage.samples[i].chargeVoltageMV
                if (chargeVoltage_mV != 0) {
                    points.push({
                        tags:{
                            board_id: boardId,
                            sensor: 'chargeVoltage_mV',
                        },
                        fields: {
                            value: chargeVoltage_mV,
                            time: timestamp
                        }
                    })
                }
                
                let chargeCurrent_mA = deserializedMessage.samples[i].chargeCurrentMA
                if (chargeCurrent_mA != 0) {
                    points.push({
                        tags:{
                            board_id: boardId,
                            sensor: 'chargeCurrent_mA',
                        },
                        fields: {
                            value: chargeCurrent_mA,
                            time: timestamp
                        }
                    })
                }

                // Extract AnalogChannel
                for (let j = 0; j < deserializedMessage.samples[i].analogChan.length; j++) {
                    
                    let analogChan = deserializedMessage.samples[i].analogChan[j]
                    if (!_.isEmpty(analogChan)) {
                        for (const [key, value] of Object.entries(analogChan)) {
                            points.push({
                                tags:{
                                    board_id: boardId,
                                    sensor: 'analogChan',
                                    sensorNum: j,
                                    channel: key
                                },
                                fields: {
                                    value: value,
                                    time: timestamp
                                }
                            })
                        }
                    }
                }

                // Extract Differential Channel
                for (let j = 0; j < deserializedMessage.samples[i].differentialChan.length; j++) {
                    
                    let differentialChan = deserializedMessage.samples[i].differentialChan[j]
                    if (!_.isEmpty(differentialChan)) {
                        for (const [key, value] of Object.entries(differentialChan)) {
                            points.push({
                                tags:{
                                    board_id: boardId,
                                    sensor: 'differentialChan',
                                    sensorNum: j,
                                    channel: key
                                },
                                fields: {
                                    value: value,
                                    time: timestamp
                                }
                            })
                        }
                    }
                }

                // Extract Salinity Channel
                for (let j = 0; j < deserializedMessage.samples[i].salinityChan.length; j++) {
                    
                    let salinityChan = deserializedMessage.samples[i].salinityChan[j]
                    if (!_.isEmpty(salinityChan)) {
                        for (const [key, value] of Object.entries(salinityChan)) {
                            points.push({
                                tags:{
                                    board_id: boardId,
                                    sensor: 'salinityChan',
                                    sensorNum: j,
                                    channel: key
                                },
                                fields: {
                                    value: value,
                                    time: timestamp
                                }
                            })
                        }
                    }
                }

                let imudata = deserializedMessage.samples[i].imudata
                    //console.log("trying IMU")
                    //console.log(imudata)
                    if (!_.isEmpty(imudata)) {
                        //console.log("IMU is not empty")
                        for (const [key, value] of Object.entries(imudata)) {
                            //console.log("IMU value")
                            //console.log(key)
                            //console.log(value)

                            points.push({
                                tags:{
                                    board_id: boardId,
                                    sensor: 'imudata',
                                    channel: key
                                },
                                fields: {
                                    value: value,
                                    time: timestamp
                                }
                            })
                        }
                    }

                    let gpsdata = deserializedMessage.samples[i].gpsdata
                    if (!_.isEmpty(gpsdata)) {
                        for (const [key, value] of Object.entries(gpsdata)) {

                            points.push({
                                tags:{
                                    board_id: boardId,
                                    sensor: 'gpsdata',
                                    channel: key
                                },
                                fields: {
                                    value: value,
                                    time: timestamp
                                }
                            })
                        }
                    }
            }

            if (points.length > 0) {
                await this.writePoints(points)
            }
        }
    }
}

module.exports = DaqMessage;