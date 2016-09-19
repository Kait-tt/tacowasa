'use strict';
module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.addColumn(
            'githubTasks',
            'projectId',
            {
                type: Sequelize.STRING,
                allowNull: false
            }
        );
    },

    down: function (queryInterface, Sequelize) {
        return queryInterface.removeColumn('githubTasks', 'projectId');
    }
};
