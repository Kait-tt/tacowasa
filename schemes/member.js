'use strict';
module.exports = function(sequelize, DataTypes) {
    const Member = sequelize.define('member', {
        prevMemberId: {
            type: DataTypes.INTEGER
        },
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
        }
    }, {
        classMethods: {
            associate: function(models) {
                Member.belongsTo(models.AccessLevel, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                Member.belongsTo(models.Project);
                Member.belongsTo(Member, {
                    as: 'prevMember',
                    foreignKey: {
                        name: 'prevMemberId'
                    }
                });
                Member.belongsTo(Member, {
                    as: 'nextMember',
                    foreignKey: {
                        as: 'nextMemberId'
                    }
                });
            }
        }
    });
    return Member;
};