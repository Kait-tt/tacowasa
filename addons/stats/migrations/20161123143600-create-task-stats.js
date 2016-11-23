'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('taskStats', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            taskId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            isStagnation: {
                allowNull: false,
                defaultValue: false,
                type: Sequelize.BOOLEAN
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
        }).then(() => {
            return queryInterface.addIndex(
                'taskStats',
                ['taskId'],
                {
                    indexName: 'UniqueTaskId',
                    indicesType: 'UNIQUE'
                }
            )
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('taskStats');
    }
};
