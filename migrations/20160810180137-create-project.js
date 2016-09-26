'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('projects', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      createUserId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      defaultStageId: {
        type: Sequelize.INTEGER
      },
      defaultAccessLevelId: {
        type: Sequelize.INTEGER
      },
      defaultCostId: {
        type: Sequelize.INTEGER
      },
      defaultWipLimit: {
        defaultValue: 12,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    },
    {
      engine: process.env.NODE_ENV === 'test' ? 'MYISAM' : 'InnoDB',
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('projects');
  }
};
