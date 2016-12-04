# coding:utf-8
import json
import argparse
import matplotlib.pyplot as plt
import numpy as np
import math
from predictors import AveragePredictor

parser = argparse.ArgumentParser(description='Test all predication')
parser.add_argument('-s', '--src', required=True)
args = parser.parse_args()

projects = json.load(open(args.src, 'r'))
n = len(projects)
m = math.floor(math.sqrt(n))
r = math.floor(n / m)
c = math.floor((n + r - 1) / r)

for idx, project in enumerate(projects):
    print('load : {}'.format(project['projectName']))
    tasks = []
    diffps = []
    for task in project['tasks']:
        predicate = AveragePredictor.predicate(tasks, task['userId'], task['cost'])
        if predicate is None:
            # print(None)
            diffps.append(None)
        else:
            actual = task['actualWorkTime']
            diffp = min(predicate / actual, 10)
            # print('diffp: {:.2f}% , actual: {:.2f}minutes , predicate: {:.2f}minutes , cost: {}pts'
            #       .format(diffp * 100, actual, predicate, task['cost']))
            diffps.append(diffp)
        tasks.append(task)
    # print()

    plt.subplot(r, c, idx + 1)
    plt.title(project['projectName'])
    plt.plot(range(len(tasks)), diffps, label='average')

plt.legend()
plt.tight_layout()
plt.show()
