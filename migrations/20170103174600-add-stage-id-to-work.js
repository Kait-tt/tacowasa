'use strict';
const db = require('../lib/schemes');

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn('works', 'stageId', {
        allowNull: true,
        type: Sequelize.INTEGER
    });

    const projects = await db.Project.findAll();
    for (let {id: projectId, name} of projects) {
        const doingStage = await db.Stage.findOne({where: {name: 'doing', projectId}});
        if (!doingStage) { throw new Error('doing stage was not found.'); }
        const tasks = await db.Task.findAll({where: {projectId}});
        await db.Work.update({stageId: doingStage.id}, {where: {taskId: {in: tasks.map(x => x.id)}}});
    }

    await queryInterface.changeColumn('works', 'stageId', {
        allowNull: false,
        type: Sequelize.INTEGER
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('works', 'stageId');
  }
};
