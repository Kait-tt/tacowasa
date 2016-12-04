# coding:utf-8
from statistics import mean

class AveragePredicate:
    @classmethod
    def predicate(cls, tasks, user_id, cost):
        user_tasks = [x for x in tasks if x['userId'] == user_id]
        if len(user_tasks) == 0:
            return None
        readtime = mean([x['actualWorkTime'] / x['cost'] for x in tasks])
        return readtime * cost
