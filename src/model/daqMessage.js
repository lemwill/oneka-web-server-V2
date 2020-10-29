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

            // Extract AnalogChannel
            for (let i = 0; i < deserializedMessage.samples.length; i++) {
                let timestamp = deserializedMessage.samples[i].ntpTimestamp;
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
            }

            if (points.length > 0) {
                await this.writePoints(points)
            }
        }
    }
}

module.exports = DaqMessage;