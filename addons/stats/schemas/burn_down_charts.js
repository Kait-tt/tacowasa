'use strict';
module.exports = function (sequelize, DataTypes) {
    const BurnDownChart = sequelize.define('burnDownChart', {
        taskNum: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        completedTaskNum: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        totalWorkTime: {
            allowNull: false,
            type: DataTypes.INTEGER
        }
    }, {
        classMethods: {
            associate: function (models) {
                BurnDownChart.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return BurnDownChart;
};
