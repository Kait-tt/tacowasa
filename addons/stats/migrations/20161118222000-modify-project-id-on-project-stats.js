'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('iterations', {
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
            startTime: {
                allowNull: false,
                type: Sequelize.DATE
            },
            endTime: {
                allowNull: false,
                type: Sequelize.DATE
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
            engine: process.env.NODE_ENV === 'test' ? 'MYISAM' : 'InnoDB',
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('iterations');
    }
};
