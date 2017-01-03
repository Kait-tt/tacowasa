'use strict';
const co = require('co');
const db = require('../lib/schemes');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return co(function* () {
        yield queryInterface.addColumn('works', 'stageId', {
            allowNull: true,
            type: Sequelize.INTEGER
        });

        const projects = yield db.Project.findAll();
        for (let {id: projectId, name} of projects) {
            const doingStage = yield db.Stage.findOne({where: {name: 'doing', projectId}});
            if (!doingStage) { throw new Error('doing stage was not found.'); }
            const tasks = yield db.Task.findAll({where: {projectId}});
            yield db.Work.update({stageId: doingStage.id}, {where: {taskId: {in: tasks.map(x => x.id)}}});
        }

        yield queryInterface.changeColumn('works', 'stageId', {
            allowNull: false,
            type: Sequelize.INTEGER
        });
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('works', 'stageId');
  }
};
