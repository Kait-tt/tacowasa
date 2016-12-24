# coding:utf-8
from . import AveragePredictorEachCost
from .util import *


class AveragePredictorWithOtherUsers(AveragePredictorEachCost):
    @classmethod
    def predicate(cls, tasks, user_id, cost):
        if len(tasks) == 0:
            return float('inf')

        successful, res = cls.sub_predicate(tasks, user_id, cost)
        return res if successful else super(AveragePredictorWithOtherUsers, cls).predicate(tasks, user_id, cost)

    @classmethod
    def sub_predicate(cls, tasks, user_id, cost):
        near_tasks = filter_cost_user_id(tasks, cost, user_id)
        if len(near_tasks) > 1:
            return False, 0

        costs = uniq_costs(tasks)
        user_ids = uniq_user_ids(tasks)

        temps = []
        for u in without(user_ids, user_id):
            ts1 = filter_user_id(tasks, u)
            ts2 = group_by_cost(ts1, costs).values()
            if len(ts1) > len(temps) and any([len(x) > 2 for x in ts2]):
                temps = ts1
        if len(temps) == 0:
            return False, 0

        your_other_cost_tasks = [x for x in tasks if x['cost'] != cost and x['userId'] == user_id]
        if len(your_other_cost_tasks) == 0:
            return False, 0

        other_cts = map_time(filter_cost(temps, cost))
        if len(other_cts) == 0:
            return False, 0
        other_cmean = mean(other_cts)

        # TODO: improve the algorithm

        res = []
        for c in [x for x in costs if x != cost]:
            other_ts = map_time(filter_cost(temps, c))
            your_ts = map_time(filter_cost(your_other_cost_tasks, c))

            if len(other_ts) == 0 or len(your_ts) == 0:
                continue

            other_mean = mean(other_ts)
            your_mean = mean(your_ts)
            a = your_mean * (other_cmean / other_mean)
            res.append(a)

        if len(res) == 0:
            return False, 0

        return True, mean(res)
