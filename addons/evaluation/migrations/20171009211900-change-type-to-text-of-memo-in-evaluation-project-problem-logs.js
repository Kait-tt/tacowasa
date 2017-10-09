module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn(
            'evaluationProjectSolverLogs',
            'memo',
            {
                allowNull: true,
                type: Sequelize.TEXT
            }
        );
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn(
            'evaluationProjectSolverLogs',
            'memo',
            {
                allowNull: true,
                type: Sequelize.STRING
            }
        );
    }
};

