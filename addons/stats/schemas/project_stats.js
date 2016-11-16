'use strict';
module.exports = function (sequelize, DataTypes) {
    const ProjectStats = sequelize.define('projectStats', {
        throughput: {
            allowNull: false,
            type: DataTypes.FLOAT
        }
    }, {
        classMethods: {
            associate: function (models) {
                ProjectStats.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return ProjectStats;
};
