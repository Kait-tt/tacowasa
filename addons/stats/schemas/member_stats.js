'use strict';
module.exports = function (sequelize, DataTypes) {
    const MemberStats = sequelize.define('memberStats', {
        throughput: {
            allowNull: false,
            type: DataTypes.FLOAT
        },
        promisedWorkTime: {
            allowNull: false,
            defaultValue: 0,
            type: DataTypes.INTEGER
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
