# coding:utf-8
from . import AveragePredictorWithoutOutliers, AveragePredictorEachCost
from .util import *
import numpy as np


class RegressionPrediction(AveragePredictorWithoutOutliers):
    @classmethod
    def predicate(cls, tasks, user_id, cost):
        _tasks = tasks
        tasks = filter_overwork(tasks)

        if len(tasks) == 0:
            return float('inf')

        same_user_tasks = filter_user_id(tasks, user_id)
        if len(same_user_tasks) > 0:
            tasks = same_user_tasks

        filtered_tasks = cls.filter_outliers(tasks)
        if len(filtered_tasks):
            tasks = filtered_tasks

        if len(uniq_costs(tasks)) < 2:
            return AveragePredictorEachCost.predicate(_tasks, user_id, cost)

        x = np.array([x['cost'] for x in tasks])
        y = np.array([x['actualWorkTime'] for x in tasks])

        z = np.polyfit(x, y, len(uniq_costs(tasks)) - 1)

        p = np.poly1d(z)
        s = p(cost)

        return s
