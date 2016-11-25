'use strict';
const Util = require('../../modules/util');
const helper = require('../../../../spec/helper');
const expect = helper.expect;

describe('addons', () => {
    describe('stats', () => {
        describe('modules', () => {
            describe('Util', () => {
                const samples = [
                    {ary: [10, 10, 10, 20, 20, 20, 30, 30], value: 10, lower: 0, upper: 3},
                    {ary: [10, 10, 10, 20, 20, 20, 30, 30], value: 20, lower: 3, upper: 6},
                    {ary: [10, 10, 10, 20, 20, 20, 30, 30], value: 30, lower: 6, upper: 8},
                    {ary: [10, 10, 10, 20, 20, 20, 30, 30], value: 50, lower: 8, upper: 8},
                    {ary: [10, 10, 10, 20, 20, 20, 30, 30], value: 5, lower: 0, upper: 0},
                    {ary: [10, 10, 10, 20, 20, 20, 30, 30], value: 15, lower: 3, upper: 3},
                    {ary: [10, 10, 10, 20, 20, 30, 30], value: 10, lower: 0, upper: 3},
                    {ary: [10, 10, 10, 20, 20, 30, 30], value: 20, lower: 3, upper: 5},
                    {ary: [10, 10, 10, 20, 20, 30, 30], value: 30, lower: 5, upper: 7},
                    {ary: [10, 10, 10, 20, 20, 30, 30], value: 50, lower: 7, upper: 7},
                    {ary: [], value: 10, lower: 0, upper: 0}
                ];

                describe('#lowerBound', () => {
                    it('should return pos to lower bound', () => {
                        const results = samples.map(({ary, value}) => Util.lowerBound(ary, value));
                        expect(results).to.have.members(samples.map(x => x.lower));
                    });
                });

                describe('#upperBound', () => {
                    it('should return pos to lower bound', () => {
                        const results = samples.map(({ary, value}) => Util.upperBound(ary, value));
                        expect(results).to.have.members(samples.map(x => x.upper));
                    });
                });
            });
        });
    });
});
