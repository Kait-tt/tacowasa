'use strict';
module.exports = function(sequelize, DataTypes) {
    var Stage = sequelize.define('stage', {
        projectId: {
            allowNull: false,
            type: DataTypes.STRING
        },
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
    }, {
        classMethods: {
            associate: function(models) {
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