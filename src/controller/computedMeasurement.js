const _ = require('lodash');

const winston = require('../config/winston');

const {ComputedMeasurementMdl} = require('../model');
/**
 * Controller for computed measurements
 */
class ComputedMeasurement {
  /**
   * ComputedMeasurement constructor
   * @param {Number} buoyId Id of the buoy to get measurement for
   */
  constructor(buoyId) {
    this.buoyId = buoyId;
  }

  /**
   * Perform the computation on the points based on the saved computation templates
   * @param {Array} points Array of points deserialized from the buoy message
   */
  async performComputation(points) {
    if (_.isEmpty(points)) {
      return [];
    }

    const computationTemplate = await ComputedMeasurementMdl.find({buoyId: this.buoyId});
    if (_.isEmpty(computationTemplate)) {
      return points;
    }

    winston.debug(`Find folowing ${computationTemplate.length} `+
                  `templates for buoyId: ${this.buoyId}`);

    for (const template of computationTemplate) {
      const requiredPoints = ComputedMeasurement._getPointsForTemplate(template, points);
      if (requiredPoints.length > 0) {
        points = points.concat(ComputedMeasurement._compute(requiredPoints, template));
      }
    }

    return points;
  }

  /**
   * Fetch the necessary point for a given template
   * @param {Object} template Template
   * @param {Array} points list of points from buoy
   * @return {Array} Array of point for given template
   */
  static _getPointsForTemplate(template, points) {
    const returnedPoints = [];
    for (const point of points) {
      if (_.some(template.requiredPoints, {measurement: point.measurement})) {
        returnedPoints.push(point);
      }
    }
    return returnedPoints;
  }

  /**
   * apply computation template on a point and return the result.
   * @param {Array} points Points for computation
   * @param {Object} template Template to be applied
   * @return {Object} Computed point
   */
  static _compute(points, template) {
    switch (template.computationType) {
    case 'affine':
      return ComputedMeasurement._affineComputation(points, template);
    case 'multiply':
      return ComputedMeasurement._multiplyComputation(points, template);
    case 'affineTimesAffine':
      return ComputedMeasurement._affineTimesAffineComputation(points, template);

    default:
      return;
    }
  }

  /**
   * apply affine computation template on a point and return the result.
   * @param {Array} points Points for computation
   * @param {Object} template Template to be applied
   * @return {Object} Computed point
   */
  static _affineComputation(points, template) {
    const a = template.parameters.find((elem) => elem.name === 'a');
    const b = template.parameters.find((elem) => elem.name === 'b');
    const returnPoints = [];
    for (const point of points) {
      returnPoints.push({
        measurement: template.name,
        tags: {
          'board_id': point.tags.board_id,
        },
        fields: {
          value: (point.fields[template.requiredPoints[0].field] * a.value) + b.value,
        },
        timestamp: point.timestamp,
      });
    }
    return returnPoints;
  }

  /**
   * Multiply point with the same timestamp
   * @param {*} points List of points from buoy
   * @param {*} template Computation template
   * @return {Array} Computed points
   */
  static _multiplyComputation(points, template) {
    const timestamps = [];
    const products = {};
    const result = [];

    // Find uniques timestamp and prepare result list
    for (const point of points) {
      if (!_.includes(timestamps, point.timestamp)) {
        timestamps.push(point.timestamp);
        products[point.timestamp] = 1;
      }
    }

    for (const timestamp of timestamps) {
      for (const requiredPoint of template.requiredPoints) {
        const pointToMultiply = _.find(points, {
          'measurement': requiredPoint.measurement,
          'timestamp': timestamp,
        });
        products[timestamp] *= pointToMultiply.fields[requiredPoint.field];
      }

      result.push({
        measurement: template.name,
        tags: {
          'board_id': template.buoyId,
        },
        fields: {
          value: products[timestamp],
        },
        timestamp: timestamp,
      });
    }

    return result;
  }

  /**
   * Templates for multiplication of two affine templates
   * (a * x + b) * (c * z + d)
   * @param {*} points List of points from buoy
   * @param {*} template Computation template
   * @return {Array} Computed points
   */
  static _affineTimesAffineComputation(points, template) {
    const timestamps = [];
    const products = {};
    const result = [];

    // Find uniques timestamp and prepare result list
    for (const point of points) {
      if (!_.includes(timestamps, point.timestamp)) {
        timestamps.push(point.timestamp);
        products[point.timestamp] = 1;
      }
    }

    for (const timestamp of timestamps) {
      const a = template.parameters.find((elem) => elem.name === 'a').value;
      const b = template.parameters.find((elem) => elem.name === 'b').value;
      const c = template.parameters.find((elem) => elem.name === 'c').value;
      const d = template.parameters.find((elem) => elem.name === 'd').value;
      const x = template.parameters.find((elem) => elem.name === 'x');
      const z = template.parameters.find((elem) => elem.name === 'z');

      const xValue = _.find(points, {
        'measurement': x.alias.measurement,
        'timestamp': timestamp,
      }).fields[x.alias.field];

      const zValue = _.find(points, {
        'measurement': z.alias.measurement,
        'timestamp': timestamp,
      }).fields[z.alias.field];

      result.push({
        measurement: template.name,
        tags: {
          'board_id': template.buoyId,
        },
        fields: {
          value: ((a * xValue) + b) * ((c * zValue) + d),
        },
        timestamp: timestamp,
      });
    }

    return result;
  }
}

module.exports = ComputedMeasurement;
