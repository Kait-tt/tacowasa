'use strict';
var _ = require('lodash');

const chars = 'abcdefghijklmnopqrstufwxyzABCDEFGHIJKLMNOPQRSTUFWXYZ1234567890';

module.exports = function(sequelize, DataTypes) {
    var Project = sequelize.define('project', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            defaultValue: () => _.sampleSize(chars, 12).join('')
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        createUserId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        defaultStageId: {
            type: DataTypes.INTEGER
        },
        defaultAccessLevelId: {
            type: DataTypes.INTEGER
        },
        defaultCostId: {
            type: DataTypes.INTEGER
        },
        defaultWipLimit: {
            defaultValue: 12,
            type: DataTypes.INTEGER
        },
    }, {
        classMethods: {
            associate: function(models) {
                Project.belongsToMany(models.User, {
                    through: models.Member
                });
                Project.belongsTo(models.User, {
                    as: 'createUser',
                    foreignKey: {
                        name: 'createUserId', allowNull: false
                    }
                });
                Project.hasMany(models.Stage);
            }
        }
    });
    return Project;
};
