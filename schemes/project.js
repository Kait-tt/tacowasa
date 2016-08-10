'use strict';

const chars = 'abcdefghijklmnopqrstufwxyzABCDEFGHIJKLMNOPQRSTUFWXYZ1234567890';

module.exports = function(sequelize, DataTypes) {
    var project = sequelize.define('project', {
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
            allowNull: false,
            type: DataTypes.INTEGER
        },
        defaultAccessLevelId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        defaultCostId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        defaultWipLimit: {
            allowNull: false,
            defaultValue: 12,
            type: DataTypes.INTEGER
        },
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return project;
};
var chars = [].concat(
    this.lowerList(),
    this.upperList(),
    this.numList());

return _.sample(chars, length).join('');