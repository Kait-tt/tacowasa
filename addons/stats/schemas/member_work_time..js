'use strict';
module.exports = function (sequelize, DataTypes) {
    const MemberStats = sequelize.define('memberStats', {
        promisedMinutes: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        actualMinutes: {
            allowNull: false,
            defaultValue: 0,
            type: DataTypes.INTEGER
        },
        startTime: {
            allowNull: false,
            type: DataTypes.DATE
        },
        endTime: {
            allowNull: false,
            type: DataTypes.DATE
        }
    }, {
        classMethods: {
            associate: function (models) {
                MemberStats.belongsTo(models.Member, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return MemberStats;
};
