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
        allowNull: false,
        type: Sequelize.INTEGER
      },
      defaultAccessLevelId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      defaultCostId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      defaultWipLimit: {
        allowNull: false,
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
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('projects');
  }
};