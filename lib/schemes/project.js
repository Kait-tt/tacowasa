'use strict';
const _ = require('lodash');

const chars = 'abcdefghijklmnopqrstufwxyzABCDEFGHIJKLMNOPQRSTUFWXYZ1234567890';

module.exports = function(sequelize, DataTypes) {
    const Project = sequelize.define('project', {
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
                Project.hasMany(models.Stage);
                Project.hasMany(models.Cost);
                Project.hasMany(models.Task);
                Project.hasMany(models.Label);
                Project.hasMany(models.AccessLevel);
                Project.belongsTo(models.User, {
                    as: 'createUser',
                    foreignKey: {
                        name: 'createUserId',
                        allowNull: false
                    }
                });
                Project.belongsTo(models.Stage, {
                    as: 'defaultStage',
                    foreignKey: {
                        name: 'defaultStageId'
                    }
                });
                Project.belongsTo(models.AccessLevel, {
                    as: 'defaultAccessLevel',
                    foreignKey: {
                        name: 'defaultAccessLevelId'
                    }
                });
                Project.belongsTo(models.Cost, {
                    as: 'defaultCost',
                    foreignKey: {
                        name: 'defaultCostId'
                    }
                });
                Project.hasOne(models.GitHubRepository);
            }
        }
    });
    return Project;
};
