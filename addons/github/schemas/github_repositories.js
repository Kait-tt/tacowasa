'use strict';
module.exports = function(sequelize, DataTypes) {
    const GitHubRepository = sequelize.define('githubRepository', {
        username: {
            allowNull: false,
            type: DataTypes.STRING
        },
        reponame: {
            allowNull: false,
            type: DataTypes.STRING
        },
        sync: {
            allowNull: false,
            defaultValue: true,
            type: DataTypes.BOOLEAN
        },
        hookId: {
            type: DataTypes.STRING
        },
        lastToken: {
            type: DataTypes.STRING
        },
    }, {
        classMethods: {
            associate: function(models) {
                GitHubRepository.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return GitHubRepository;
};
