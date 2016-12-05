# coding:utf-8
from . import AbstractPredictor
from .util import *


class AveragePredictor(AbstractPredictor):
    @classmethod
    def predicate(cls, tasks, user_id, cost):
        if len(tasks) == 0:
            return float('inf')

        same_user_tasks = filter_user_id(tasks, user_id)
        if len(same_user_tasks) > 4:
            tasks = same_user_tasks

        lt = lead_time(tasks)
        return lt * cost
