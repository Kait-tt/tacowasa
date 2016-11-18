'use strict';
module.exports = function (sequelize, DataTypes) {
    const MemberWorkTime = sequelize.define('memberWorkTime', {
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
                MemberWorkTime.belongsTo(models.Member, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return MemberWorkTime;
};
