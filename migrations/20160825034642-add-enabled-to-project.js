'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
        'projects',
        'enabled',
        {
          allowNull: false,
          defaultValue: true,
          type: Sequelize.BOOLEAN
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
        'projects',
        'enabled'
    );
  }
};
