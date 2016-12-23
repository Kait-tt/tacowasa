'use strict';
module.exports = function (sequelize, DataTypes) {
    const ProjectStats = sequelize.define('projectStats', {
        throughput: {
            allowNull: false,
            defaultValue: 0,
            type: DataTypes.FLOAT
        },
        notifyUrl: {
            allowNull: true,
            type: DataTypes.STRING
        }
    }, {
        classMethods: {
            associate: function (models) {
                ProjectStats.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            },
            indexes: [
                {
                    unique: true,
                    fields: ['projectId']
                }
            ]
        }
    });
    return ProjectStats;
};
