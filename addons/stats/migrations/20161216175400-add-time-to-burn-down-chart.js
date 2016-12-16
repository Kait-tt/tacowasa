'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
        'burnDownCharts',
        'time',
        {
          allowNull: false,
          type: Sequelize.DATE
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
        'burnDownCharts',
        'time'
    );
  }
};
