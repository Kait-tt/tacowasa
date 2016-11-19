'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addIndex(
            'projectStats',
            ['projectId'],
            {
                indexName: 'UniqueProjectId',
                indicesType: 'UNIQUE'
            }
        )
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.removeIndex(
            'projectStats',
            'UniqueProjectId'
        );
    }
};
