'use strict';
module.exports = function(sequelize, DataTypes) {
    var Work = sequelize.define('work', {
        isEnded: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        },
        startTime: {
            allowNull: false,
            defaultValue: Date.now,
            type: DataTypes.DATE
        },
        endTime: {
            defaultValue: null,
            type: DataTypes.DATE
        },
    }, {
        classMethods: {
            associate: function(models) {
                Work.belongsTo(models.User, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                Work.belongsTo(models.Task, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return Work;
};