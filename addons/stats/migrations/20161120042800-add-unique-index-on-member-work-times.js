'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addIndex(
            'memberWorkTimes',
            ['memberId', 'iterationId'],
            {
                indexName: 'UniqueMemberIdIterationId',
                indicesType: 'UNIQUE'
            }
        )
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.removeIndex(
            'memberWorkTimes',
            'UniqueMemberIdIterationId'
        );
    }
};
