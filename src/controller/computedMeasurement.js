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

    winston.debug(`Find folowing templates for buoyId: ${this.buoyId}\n${computationTemplate}`);

    for (const template of computationTemplate) {
      const requiredPoints = ComputedMeasurement._getPointsForTemplate(template, points);
      if (requiredPoints.length > 0) {
        points.push(ComputedMeasurement._compute(requiredPoints, template));
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

    default:
      return;
    }
  }

  /**
   * apply computation template on a point and return the result.
   * @param {Array} points Points for computation
   * @param {Object} template Template to be applied
   * @return {Object} Computed point
   */
  static _affineComputation(point, template) {
    const a = template.parameters.find((elem) => elem.name === 'a');
    const b = template.parameters.find((elem) => elem.name === 'b');

    return {
      measurement: template.name,
      tags: {
        'board_id': point.tags.board_id,
      },
      fields: {
        value: (point.fields[template.field] * a.value) + b.value,
      },
      timestamp: point.timestamp,
    };
  }
}

module.exports = ComputedMeasurement;
