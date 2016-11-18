'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn(
            'projectStats',
            'projectId',
            {
                allowNull: false,
                type: Sequelize.STRING
            }
        )
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn(
            'projectStats',
            'projectId',
            {
                allowNull: false,
                type: Sequelize.INTEGER
            }
        );
    }
};
