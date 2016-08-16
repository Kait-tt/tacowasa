'use strict';
module.exports = function(sequelize, DataTypes) {
    var AccessLevel = sequelize.define('accessLevel', {
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        canReadReports: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        },
        canWriteOwnTasks: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        },
        canWriteTasks: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        },
        canWriteLabels: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        },
        canWriteProject: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        },
    }, {
        classMethods: {
            associate: function(models) {
                AccessLevel.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                AccessLevel.hasMany(models.Member);
            }
        }
    });
    return AccessLevel;
};
