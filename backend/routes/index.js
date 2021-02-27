const snakeCase = require('lodash/snakeCase');
const express = require('express');

const winston = require('../config/winston');

module.exports = (app) => {
  
  require('fs')
    .readdirSync(__dirname)
    .forEach((file) => {
      if (file === 'index.js') return;
      const path =
        '/v1/' +
        (file !== 'root.js' ? snakeCase(file.replace('.js', '')) : '');
      const router = new express.Router();
      const route = require(require('path').join(__dirname, file))(router);
      winston.info(`Load route ${path} with file ${require('path').join(__dirname, file)}`)
      app.use(path, route);
    });
};
