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
        }
    }, {
        classMethods: {
            associate: function (models) {
                MemberWorkTime.belongsTo(models.Member, {
                    foreignKey: {
                        allowNull: true
                    }
                });

                MemberWorkTime.belongsTo(models.Iteration, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            },
            indexes: [
                {
                    unique: true,
                    fields: ['memberId', 'iterationId']
                }
            ]
        }
    });
    return MemberWorkTime;
};
