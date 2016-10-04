'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'users',
        'username',
        {
          allowNull: false,
          unique: true,
          type: Sequelize.STRING.BINARY
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'users',
        'username',
        {
          allowNull: false,
          unique: true,
          type: Sequelize.STRING
        }
    );
  }
};
