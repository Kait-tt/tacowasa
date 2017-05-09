'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('stage', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            let project, stage;

            beforeEach(async () => {
                const user = await db.User.create({username: 'user1'});
                project = await db.Project.create({name: 'project1', createUserId: user.id});
                stage = await db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id});
                await project.addStage(stage);
            });

            it('should create a new stage', async () => {
                const _stages = await db.Stage.findAll();
                expect(_stages).to.have.lengthOf(1);
                expect(_stages[0]).to.have.property('name', 'todo');
                expect(_stages[0]).to.have.property('displayName', 'ToDo');
                expect(_stages[0]).to.have.property('assigned', true);
                expect(_stages[0]).to.have.property('projectId', project.id);
            });

            it('project should have a stage', async () => {
                const _project = await db.Project.findById(project.id, {include: [{model: db.Stage, as: 'stages'}]});
                expect(_project.stages).to.have.lengthOf(1);
                expect(_project.stages[0]).to.have.property('id', stage.id);
                expect(_project.stages[0]).to.have.property('name', 'todo');
            });
        });
    });
});
