# coding:utf-8
from statistics import pstdev
from . import AveragePredictorWithoutOutliers
from .util import *


class AveragePredictorWithoutOutliers2(AveragePredictorWithoutOutliers):
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
                std = pstdev(times)
                tasks2.extend([x for x in tasks if abs(x['actualWorkTime'] - avg) < std])
        return tasks2
