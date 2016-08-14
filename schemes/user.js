'use strict';
module.exports = function(sequelize, DataTypes) {
    const User = sequelize.define('user', {
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
                User.hasMany(models.Work);
            }
        }
    });
    return User;
};