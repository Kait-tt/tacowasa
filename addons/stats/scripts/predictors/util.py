# coding:utf-8
from statistics import mean


def filter_user_id(tasks, user_id):
    return [x for x in tasks if x['userId'] == user_id]


def filter_cost(tasks, cost):
    return [x for x in tasks if x['cost'] == cost]


def filter_cost_user_id(tasks, cost, user_id):
    return [x for x in tasks if x['cost'] == cost and x['userId'] == user_id]


def group_by_cost(tasks, costs):
    res = {}
    for c in costs:
        res[c] = []
    for task in tasks:
        res[task['cost']].append(task)
    return res


def uniq_costs(tasks):
    return list(set([x['cost'] for x in tasks]))


def uniq_user_ids(tasks):
    return list(set([x['userId'] for x in tasks]))


def map_time(tasks):
    return [x['actualWorkTime'] for x in tasks]


def lead_time(tasks):
    return mean([x['actualWorkTime'] / x['cost'] for x in tasks])


def without(ary, without_value):
    return [x for x in ary if x != without_value]
