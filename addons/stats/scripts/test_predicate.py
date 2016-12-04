# coding:utf-8
import json
import argparse
import matplotlib.pyplot as plt
import numpy as np
from predicates import AveragePredicate

parser = argparse.ArgumentParser(description='Test all predication')
parser.add_argument('-s', '--src', required=True)
args = parser.parse_args()

projects = json.load(open(args.src, 'r'))

for project in projects:
    if project['projectName'] == 'swkoubou.rms':
        continue

    print('load : {}'.format(project['projectName']))
    tasks = []
    diffps = []
    for task in project['tasks']:
        predicate = AveragePredicate.predicate(tasks, task['userId'], task['cost'])
        if predicate is None:
            print(None)
            diffps.append(None)
        else:
            actual = task['actualWorkTime']
            diffp = predicate / actual * 100
            print('diffp: {:.2f}% , actual: {:.2f}minutes , predicate: {:.2f}minutes , cost: {}pts'
                  .format(diffp, actual, predicate, task['cost']))
            diffps.append(diffp)
        tasks.append(task)
    print()
    plt.plot(range(len(tasks)), diffps, label=project['projectName'])

plt.legend()
plt.show()
