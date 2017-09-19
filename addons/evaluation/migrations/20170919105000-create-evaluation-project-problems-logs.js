module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.createTable('evaluationProjectProblemLogs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            evaluationProjectProblemId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            isOccurred: {
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
        return queryInterface.dropTable('evaluationProjectProblemLogs');
    }
};

