# coding:utf-8
from . import AveragePredictorWithoutOutliers
from .util import *


class AveragePredictorEachCost(AveragePredictorWithoutOutliers):
    @classmethod
    def predicate(cls, tasks, user_id, cost):
        tasks = filter_overwork(tasks)

        if len(tasks) == 0:
            return float('inf')

        # use only same user tasks?
        same_user_tasks = filter_user_id(tasks, user_id)
        if len(same_user_tasks) > 4:
            tasks = same_user_tasks

        # use only same cost tasks?
        same_cost_tasks = filter_cost(tasks, cost)
        if len(same_cost_tasks) > 3:
            tasks = same_cost_tasks

        tasks2 = cls.filter_outliers(tasks)

        lt = lead_time(tasks2) if len(tasks2) > 0 else lead_time(tasks)

        return lt * cost
