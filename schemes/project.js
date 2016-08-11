'use strict';
var _ = require('lodash');

const chars = 'abcdefghijklmnopqrstufwxyzABCDEFGHIJKLMNOPQRSTUFWXYZ1234567890';

module.exports = function(sequelize, DataTypes) {
    var Project = sequelize.define('project', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            defaultValue: () => _.sample(chars, 12)
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
                Project.belongsToMany(models.User, {through: models.Member});
            }
        }
    });
    return Project;
};
