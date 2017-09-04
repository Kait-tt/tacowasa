module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('evaluationProjectSolvers', {
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
            solverName: {
                allowNull: false,
                type: Sequelize.STRING
            },
            isSolved: {
                allowNull: false,
                type: Sequelize.BOOLEAN,
                default: false
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
        }).then(() => {
            return queryInterface.addIndex(
                'evaluationProjectSolvers',
                ['projectId', 'solverName'],
                {
                    indexName: 'UniqueProjectIdSolverName',
                    indicesType: 'UNIQUE'
                }
            )
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.dropTable('evaluationProjectSolvers');
    }
};

