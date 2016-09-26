'use strict';
module.exports = function (sequelize, DataTypes) {
    const Log = sequelize.define('log', {
        action: {
            allowNull: false,
            type: DataTypes.STRING
        },
        content: DataTypes.TEXT
    }, {
        classMethods: {
            associate: function (models) {
                Log.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return Log;
};
