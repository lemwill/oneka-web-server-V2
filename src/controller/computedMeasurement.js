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

    const requiredMeasurements = [];
    for (const template of computationTemplate) {
      requiredMeasurements.push(template.measurement);
    }

    winston.debug(`Looking for : ${requiredMeasurements}`);

    for (const point of points) {
      winston.debug(`Looking for ${point.measurement} in measurements`);
      if (_.includes(requiredMeasurements, point.measurement)) {
        winston.debug(`Find ${point} for computation with ${point.measurement}`);
        for (const template of computationTemplate) {
          if (point.measurement == template.measurement) {
            winston.debug(`Find ${point} for computation with ${template.name}`);
            points.push(ComputedMeasurement._compute(point, template));
          }
        }
      }
    }

    return points;
  }

  /**
   * apply computation template on a point and return the result.
   * @param {Object} point Point for computation
   * @param {Object} template Template to be applied
   * @return {Object} Computed point
   */
  static _compute(point, template) {
    switch (template.computationType) {
    case 'affine':
      return ComputedMeasurement._affineComputation(point, template);

    default:
      return;
    }
  }

  /**
   * apply computation template on a point and return the result.
   * @param {Object} point Point for computation
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
