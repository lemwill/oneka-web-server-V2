const Influx = require('../config/influx');
const winston = require('../config/winston');
const {load} = require('protobufjs');
const _ = require('lodash');

/** Deserialize data from protobuf buoy and handle data in InfluxDB */
class DaqMessage {
  /**
   * Initialize InfluxDB
   */
  constructor() {
    this.influx = Influx;
    this.db_name = 'oneka';
  }

  static REPETED_CHANNEL = ['analogChan', 'differentialChan', 'salinityChan'];
  static SINGLE_CHANNEL = ['imudata', 'gpsdata'];

  /**
   * Start the DB connection and verify if db exist else create it
   */
  async start() {
    const names = await this.influx.getDatabaseNames();
    if (!names.includes(this.db_name)) {
      try {
        await this.influx.createDatabase(this.db_name);
      } catch (err) {
        winston.error(`Unable to crate db ${err}`);
      }
    }
  }

  /**
   * Deserialize and save the data from the buoy
   * @param {buffer} message - Binary protobufe encoded data from thu buoy
   */
  async deserializeAndSave(message) {
    // Load proto deserializer
    const root = await load('./spec/daqmessage.proto');
    let deserializer = null;
    try {
      deserializer = root.lookupType('DaqMessage');
    } catch (e) {
      winston.error('Unable to get proto file');
      return -1;
    }

    // deserialize protobuf message
    let deserializedMessage = null;
    try {
      deserializedMessage = deserializer.decodeDelimited(message);
    } catch (err) {
      winston.error('Illegal message');
      return -1;
    }

    const boardId = deserializedMessage.boardId;
    const samples = deserializedMessage.samples;

    winston.debug(
      `Received message from buoy : ${JSON.stringify(deserializedMessage)}`);

    // Save samples to db
    try {
      await this.saveSamples(boardId, samples);
    } catch (err) {
      winston.error(`Unable to save samples : ${err}`);
      return -1;
    }
  }

  /**
   * Save the deserialized samples from the buoy into multiple measurments
   * @param {number} boardId - Id of the buoy
   * @param {array} samples - deserialize samples from the buoy
   */
  async saveSamples(boardId, samples) {
    let points = [];
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const timestamp = sample.ntpTimestamp.toString();
      winston.debug(`Saving samples for buoy ${boardId} @ ${timestamp} ns`);

      points = points.concat(
        this.extractBuoyPSUData(boardId, timestamp, sample));

      for (const chan of DaqMessage.REPETED_CHANNEL) {
        points = points.concat(this.extractRepetedChannelData(
          boardId,
          timestamp,
          chan,
          sample));
      }

      for (const chan of DaqMessage.SINGLE_CHANNEL) {
        points = points.concat(this.extractSingleChannelData(
          boardId,
          timestamp,
          chan,
          sample));
      }
    }

    winston.debug(`Saving points : ${JSON.stringify(points)}`);
    try {
      await this.influx.writePoints(points, {precision: 'ms'});
    } catch (err) {
      winston.error(`Unable to save points with influx ${err}`);
    }
  }

  /**
   * Extract PSU data in buoy_psu datas measurments
   * @param {number} boardId - Id of the buoy
   * @param {number} timestamp - Time of measurment
   * @param {object} data - Measurements values :
   * {
   *   'powerSupplyVoltageMV': number,
   *   'powerSupplyCurrentMA': number,
   *   'chargeVoltageMV': number,
   *   'chargeCurrentMA': number,
   * }
   * @return {object} InfluxDB formated point
   */
  extractBuoyPSUData(boardId, timestamp, data) {
    let psuData = {
      measurement: 'buoy_psu',
      tags: {
        'board_id': boardId,
      },
      fields: {},
      timestamp: timestamp,
    };

    psuData = DaqMessage._addToFieldsIfExist(
      psuData, 'powerSupplyVoltageMV', data);
    psuData = DaqMessage._addToFieldsIfExist(
      psuData, 'powerSupplyCurrentMA', data);
    psuData = DaqMessage._addToFieldsIfExist(psuData, 'chargeVoltageMV', data);
    psuData = DaqMessage._addToFieldsIfExist(psuData, 'chargeCurrentMA', data);

    if (_.isEmpty(psuData.fields)) {
      return [];
    } else {
      winston.debug(`Find PSU Data into sample : ${JSON.stringify(psuData)}`);
      return [psuData];
    }
  }

  /**
   * Extract object from data and transform it into influx measurement point
   * @param {number} boardId - Id of the buoy
   * @param {number} timestamp - Time of measurment
   * @param {string} fieldName - name of the field inside the data
   * @param {object} data data from deserialized
   * @return {array} points empty if not found
   */
  extractSingleChannelData(boardId, timestamp, fieldName, data) {
    const points = [];
    if (_.has(data, fieldName)) {
      const point = {
        measurement: `buoy_${fieldName}`,
        tags: {
          'board_id': boardId,
        },
        fields: data[fieldName],
        timestamp: timestamp,
      };

      winston.debug(
        `Find ${fieldName} channel into sample : ${JSON.stringify(
          point)}`);

      points.push(point);
    }

    return points;
  }

  /**
   * Extract object from data and transform it into influx measurement point
   * @param {number} boardId - Id of the buoy
   * @param {number} timestamp - Time of measurment
   * @param {string} fieldName - name of the field inside the data
   * @param {object} data data from deserialized
   * @return {array} points empty if not found
   */
  extractRepetedChannelData(boardId, timestamp, fieldName, data) {
    const points = [];
    if (_.has(data, fieldName)) {
      data = data[fieldName];
      for (let i = 0; i < data.length; i++) {
        const pointData = data[i];
        if (!_.isEmpty(pointData)) {
          const point = {
            measurement: `buoy_${fieldName}_${i}`,
            tags: {
              'board_id': boardId,
            },
            fields: pointData,
            timestamp: timestamp,
          };

          winston.debug(
            `Find ${fieldName} channel into sample : ${JSON.stringify(
              point)}`);

          points.push(point);
        }
      }
    }

    return points;
  }

  /**
   * Add property to point if exist in data
   * @param {object} point - InfluxDB point
   * @param {string} property - property to test for in data
   * @param {object} data - data from sample
   * @return {object} Modified point if data exist else untouched point
   */
  static _addToFieldsIfExist(point, property, data) {
    if (_.has(data, property)) {
      point.fields[property] = data[property];
    }

    return point;
  }
}

module.exports = DaqMessage;
