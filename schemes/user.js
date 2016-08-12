'use strict';
module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define('user', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        classMethods: {
            associate: function(models) {
                User.belongsToMany(models.Project, {
                    through: models.Member
                });
                User.hasMany(models.Project, {
                    as: 'createUser',
                    foreignKey: 'createUserId'
                });
            }
        }
    });
    return User;
};