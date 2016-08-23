'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
        'tasks',
        'prevTaskId',
        {
          type: Sequelize.INTEGER
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
        'tasks',
        'prevTaskId'
    );
  }
};
