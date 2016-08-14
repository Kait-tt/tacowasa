'use strict';
module.exports = function(sequelize, DataTypes) {
    const Member = sequelize.define('member', {
        nextMemberId: {
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
                Member.belongsTo(models.AccessLevel, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return Member;
};