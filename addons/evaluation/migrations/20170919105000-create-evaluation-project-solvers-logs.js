module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('evaluationProjectSolverLogs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            evaluationProjectSolverId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            isSolved: {
                allowNull: false,
                type: Sequelize.BOOLEAN,
                default: false
            },
            memo: {
                allowNull: true,
                type: Sequelize.STRING
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
        return queryInterface.dropTable('evaluationProjectSolverLogs');
    }
};

