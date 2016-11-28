'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('burnDownCharts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            projectId: {
                allowNull: false,
                type: Sequelize.STRING
            },
            taskNum: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            completedTaskNum: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            totalWorkTime: {
                allowNull: false,
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
        }, {
            engine: process.env.NODE_ENV === 'test' ? 'MYISAM' : 'InnoDB'
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('burnDownCharts');
    }
};
