'use strict';
module.exports = function (sequelize, DataTypes) {
    const MemberStats = sequelize.define('memberStats', {
        throughput: {
            allowNull: false,
            type: DataTypes.FLOAT
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
