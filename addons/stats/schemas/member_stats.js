'use strict';
module.exports = function (sequelize, DataTypes) {
    const MemberStats = sequelize.define('memberStats', {
        mean: {
            allowNull: false,
            type: DataTypes.FLOAT
        },
        low: {
            allowNull: false,
            type: DataTypes.FLOAT
        },
        high: {
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
