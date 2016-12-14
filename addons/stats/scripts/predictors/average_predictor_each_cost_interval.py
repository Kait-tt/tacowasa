# coding:utf-8
from .util import *
import numpy as np
from scipy.stats import t as sci_t
from scipy.stats import chi2 as sci_chi2


class AveragePredictorEachCostInterval:
    @classmethod
    def predicate(cls, tasks, user_id, cost):
        tasks = filter_overwork(tasks)

        if len(tasks) < 3:
            return None, None, None, None, None

        # use only same user tasks?
        same_user_tasks = filter_user_id(tasks, user_id)
        if len(same_user_tasks) > 3:
            tasks = same_user_tasks

        # use only same cost tasks?
        same_cost_tasks = filter_cost(tasks, cost)
        if len(same_cost_tasks) > 3:
            tasks = same_cost_tasks

        sample = np.array([x['actualWorkTime'] / x['cost'] for x in tasks])
        n = sample.size
        mu = np.mean(sample)
        s2 = np.var(sample, ddof=1)

        t45 = sci_t.ppf(0.95, n - 1)
        mlow, mhigh = mu + np.array([-t45, t45]) * (np.sqrt(s2) / np.sqrt(n))

        chi45a = sci_chi2.ppf(0.95, n - 1)
        shigh = np.sqrt((n - 1) * s2 / chi45a)

        low, high = mlow - shigh, mhigh + shigh

        return (mlow + mhigh) / 2 * cost, mlow * cost, mhigh * cost, low * cost, high * cost
