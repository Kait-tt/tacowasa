'use strict';
module.exports = function (sequelize, DataTypes) {
    const Activity = sequelize.define('activity', {
        sender: DataTypes.STRING,
        content: DataTypes.STRING
    }, {
        classMethods: {
            associate: function (models) {
                Activity.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return Activity;
};
