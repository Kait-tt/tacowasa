module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('evaluationProjectProblems', 'detail', {
            allowNull: true,
            type: Sequelize.TEXT
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('evaluationProjectProblems', 'detail');
    }
};

