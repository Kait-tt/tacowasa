'use strict';
module.exports = function (sequelize, DataTypes) {
    const Label = sequelize.define('label', {
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        color: {
            allowNull: false,
            type: DataTypes.STRING
        }
    }, {
        classMethods: {
            associate: function (models) {
                Label.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                Label.belongsToMany(models.Task, {
                    through: models.TaskLabel
                });
            }
        }
    });
    return Label;
};
