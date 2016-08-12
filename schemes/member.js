'use strict';
module.exports = function(sequelize, DataTypes) {
    var Member = sequelize.define('member', {
        nextMemberId: {
            type: DataTypes.INTEGER
        },
        accessLevelId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        isVisible: {
            allowNull: false,
            defaultValue: true,
            type: DataTypes.BOOLEAN
        },
        wipLimit: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        classMethods: {
            associate: function(models) {
            }
        }
    });
    return Member;
};