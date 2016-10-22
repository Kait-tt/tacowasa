'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');
const co = require('co');

// require: Transaction (e.g., InnoDB engine).
// Note: Default test engine is MyISAM.
describe('schemes', () => {
    describe.skip('db', () => {
        let user, project;

        const lastProject = () => db.Project.findOne({where: {id: project.id}});
        const updateProject = (values, transaction = null) =>
            db.Project.update(values, {where: {id: project.id}, transaction});

        beforeEach(co.wrap(function* () {
            user = yield db.User.create({username: 'user1'});
            project = yield db.Project.create({name: 'hoge', createUserId: user.id});
        }));
        afterEach(() => helper.db.clean());

        describe('#coTransaction', () => {
            context('with failure', () => {
                beforeEach(() => db.coTransaction(function* (transaction) {
                    yield updateProject({name: 'piyo'}, transaction);
                    throw new Error();
                }).catch(() => {}));

                it('should not do nothing', () => lastProject().then(x => expect(x).to.have.property('name', 'hoge')));
            });
        });

        describe('nest transaction', () => {
            context('with failure', () => {
                beforeEach(() => db.coTransaction(function* (transaction) {
                    yield updateProject({name: 'piyo'}, transaction);

                    yield db.coTransaction({transaction}, function* (transaction) {
                        yield updateProject({enabled: false}, transaction);
                        throw new Error();
                    });
                }).catch(() => {}));

                it('should not do nothing', () => lastProject().then(x => {
                    expect(x).to.have.property('name', 'hoge');
                    expect(x).to.have.property('enabled', true);
                }));
            });
        });

        describe('#lock', () => {
            let diffTime;

            beforeEach(co.wrap(function* () {
                const [first, second] = yield [
                    db.transaction(transaction => new Promise(resolve => {
                        updateProject({name: 'aaa'}, transaction).then(() => {
                            setTimeout(() => resolve(new Date()), 100);
                        });
                    })),
                    db.transaction(transaction => new Promise(resolve => {
                        setTimeout(() => {
                            updateProject({name: 'bbb'}, transaction).then(() => resolve(new Date()));
                        }, 10);
                    }))
                ];
                diffTime = second - first;
            }));

            it('should delayed second transaction', () => expect(diffTime).to.be.below(10));
            it('should apply all transaction serially', () => lastProject().then(x => expect(x).to.have.property('name', 'bbb')));
        });
    });
});
