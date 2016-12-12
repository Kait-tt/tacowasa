'use strict';
module.exports = function (sequelize, DataTypes) {
    const MemberStats = sequelize.define('memberStats', {
        mean: {
            allowNull: true,
            type: DataTypes.FLOAT
        },
        low: {
            allowNull: true,
            type: DataTypes.FLOAT
        },
        high: {
            allowNull: true,
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
                MemberStats.belongsTo(models.Cost, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return MemberStats;
};
