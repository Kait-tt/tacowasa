'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
        'projectStats',
        'notifyUrl',
        {
          allowNull: true,
          type: Sequelize.STRING
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
        'projectStats',
        'notifyUrl'
    );
  }
};
