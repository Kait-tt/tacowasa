'use strict';
module.exports = function(sequelize, DataTypes) {
    const Cost = sequelize.define('cost', {
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        value: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        classMethods: {
            associate: function(models) {
                Cost.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                Cost.hasMany(models.Task);
            }
        }
    });
    return Cost;
};
