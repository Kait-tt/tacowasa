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
            context('lock x 5', () => {
                let diffTime;

                beforeEach(co.wrap(function* () {
                    const ends = yield [
                        db.coTransaction(function* (transaction) {
                            yield db.lock(project.id, transaction);
                            yield delay(200);
                            return new Date();
                        }),
                        db.coTransaction(function* (transaction) {
                            yield delay(10);
                            yield db.lock(project.id, transaction);
                            return new Date();
                        }),
                        db.coTransaction(function* (transaction) {
                            yield delay(20);
                            yield db.lock(project.id, transaction);
                            return new Date();
                        }),
                        db.coTransaction(function* (transaction) {
                            yield delay(30);
                            yield db.lock(project.id, transaction);
                            return new Date();
                        }),
                        db.coTransaction(function* (transaction) {
                            yield delay(40);
                            yield db.lock(project.id, transaction);
                            return new Date();
                        })
                    ];
                    diffTime = ends[4] - ends[0];
                }));

                it('should delayed second transaction', () => expect(diffTime).to.be.below(50));
            });
        });

        context('nest lock', () => {
            let diffTime;

            beforeEach(co.wrap(function* () {
                const startTime = new Date();
                const ends = yield [
                    db.coTransaction(function* (transaction) {
                        yield db.lock(project.id, transaction);
                        yield db.coTransaction({transaction}, function* (transaction2) {
                            yield db.lock(project.id, transaction2);
                            console.log('transaction c was ended', new Date() - startTime);
                        });
                        yield delay(100);
                        console.log('transaction a was ended', new Date() - startTime);
                        return new Date();
                    }),
                    db.coTransaction(function* (transaction) {
                        yield delay(20);
                        yield db.lock(project.id, transaction);
                        console.log('transaction b was ended', new Date() - startTime);
                        return new Date();
                    })
                ];
                diffTime = ends[1] - ends[0];
            }));

            it('should delayed second transaction', () => expect(diffTime).to.be.below(50));
        });

        context('continuous lock', () => {
            beforeEach(co.wrap(function* () {
                yield [
                    db.transaction(t => db.lock(project.id, t).then(() => delay(Math.random() * 100))),
                    db.transaction(t => db.lock(project.id, t).then(() => delay(Math.random() * 100))),
                    db.transaction(t => db.lock(project.id, t).then(() => delay(Math.random() * 100))),
                    db.transaction(t => db.lock(project.id, t).then(() => delay(Math.random() * 100))),
                    db.transaction(t => db.lock(project.id, t).then(() => delay(Math.random() * 100))),
                    db.transaction(t => db.lock(project.id, t).then(() => delay(Math.random() * 100))),
                    db.transaction(t => db.lock(project.id, t).then(() => delay(Math.random() * 100)))
                ];
            }));

            it('should ok', () => {});
        });
    });
});

function delay (duration) {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}
