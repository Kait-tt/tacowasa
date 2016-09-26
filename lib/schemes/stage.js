'use strict';
module.exports = function (sequelize, DataTypes) {
    const Stage = sequelize.define('stage', {
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        displayName: {
            allowNull: false,
            type: DataTypes.STRING
        },
        assigned: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        canWork: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        }
    }, {
        classMethods: {
            associate: function (models) {
                Stage.hasMany(models.TaskStatusLog);
                Stage.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return Stage;
};
