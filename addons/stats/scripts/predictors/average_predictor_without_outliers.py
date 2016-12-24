# coding:utf-8
from . import AbstractPredictor
from .util import *


class AveragePredictorWithoutOutliers(AbstractPredictor):
    @classmethod
    def predicate(cls, tasks, user_id, cost):
        if len(tasks) == 0:
            return float('inf')

        same_user_tasks = filter_user_id(tasks, user_id)
        if len(same_user_tasks) > 4:
            tasks = same_user_tasks

        tasks2 = cls.filter_outliers(tasks)

        lt = lead_time(tasks2) if len(tasks2) > 0 else lead_time(tasks)

        return lt * cost

    @classmethod
    def filter_outliers(cls, tasks):
        tasks2 = []
        for _cost in uniq_costs(tasks):
            ts = filter_cost(tasks, _cost)
            if len(ts) == 1:
                tasks2.append(ts[0])
            elif len(ts) > 1:
                times = map_time(tasks)
                avg = mean(times)
                tasks2.extend([x for x in tasks if abs(x['actualWorkTime'] - avg) < avg])
        return tasks2
