# coding:utf-8
import json
import argparse
import matplotlib.pyplot as plt
import math
import predictors
from statistics import mean, stdev, median

methods = [
    # {'klass': predictors.AveragePredictor, 'name': 'Average'},
    # {'klass': predictors.AveragePredictorWithoutOutliers, 'name': 'AverageWithoutOutliers'},
    # {'klass': predictors.AveragePredictorWithoutOutliers2, 'name': 'AverageWithoutOutliers(std)'},
    {'klass': predictors.AveragePredictorEachCost, 'name': 'AverageEachCost'},
    {'klass': predictors.AveragePredictorWithOtherUsers, 'name': 'AverageWithOtherUsers'},
    {'klass': predictors.RegressionPrediction, 'name': 'Regression'}
]

MAX_E = 10


def main():
    parser = argparse.ArgumentParser(description='Test all predication')
    parser.add_argument('-s', '--src', required=True)
    args = parser.parse_args()

    projects = json.load(open(args.src, 'r'))

    results = calc_all(projects, methods)
    print_results_table(projects, methods, results)
    plot_timeline(projects, methods, results)
    plot_diffs_hist(projects, methods, results)


def calc_all(projects, methods):
    results = []

    for project in projects:
        print('load : {}'.format(project['projectName']))

        for method in methods:
            print('  calc : {}'.format(method['name']))
            tasks = []

            predicates = []
            diffs = []
            rel_es = []
            for task in project['tasks']:
                predicate = method['klass'].predicate(tasks, task['userId'], task['cost'])
                predicates.append(predicate)

                actual = task['actualWorkTime']
                diff = actual - predicate
                diffs.append(diff)
                rel_e = min(abs(diff) / actual * task['cost'], MAX_E)
                rel_es.append(rel_e)

                tasks.append(task)

            results.append({'projectName': project['projectName'], 'methodName': method['name'], 'predicates': predicates,
                            'rel_es': rel_es, 'diffs': diffs})

    return results


def plot_timeline(projects, methods, results):
    n = len(projects)
    m = math.floor(math.sqrt(n))
    r = math.floor(n / m)
    c = math.floor((n + r - 1) / r)

    for idx, project in enumerate(projects):
        plt.subplot(r, c, idx + 1)
        plt.title(project['projectName'])

        for method in methods:
            es = [x for x in results
                  if x['projectName'] == project['projectName'] and x['methodName'] == method['name']
                  ][0]['rel_es']
            plt.ylim(0, MAX_E + 0.5)
            plt.plot(range(len(es)), es, label=method['name'])

    plt.legend(bbox_to_anchor=(0.5, -0.5), loc='center', borderaxespad=0)
    plt.tight_layout()
    plt.subplots_adjust(bottom=0.2)
    plt.show()


def plot_diffs_hist(projects, methods, results):
    pn = len(projects)
    mn = len(methods)

    for pi, project in enumerate(projects):
        for mi, method in enumerate(methods):
            plt.subplot(pn, mn, pi * mn + mi + 1)
            plt.title('{} ({})'.format(project['projectName'], method['name']), fontsize=10)

            diffs = [x for x in results
                     if x['projectName'] == project['projectName'] and x['methodName'] == method['name']
                     ][0]['diffs']

            xs = [x for x in diffs if x != float('inf') and x != float('-inf')]
            xabsmax = max([abs(x) for x in xs])
            plt.xlim(-xabsmax * 1.1, xabsmax * 1.1)
            plt.hist(xs)

    plt.show()


def print_results_table(projects, methods, results):
    scores = []
    for method in methods:
        es = []
        for project in projects:
            rel_es = [x for x in results
                      if x['projectName'] == project['projectName'] and x['methodName'] == method['name']
                      ][0]['rel_es']
            es.extend(rel_es)
        scores.append({
            'name': method['name'],
            'sum': sum(es),
            'mean': mean(es),
            'stddev': stdev(es),
            'median': median(es)
        })

    scores.sort(key=lambda x: x['mean'])

    print('{0:4} | {1:30} | {2:8} | {3:5} | {4:6} | {5:6}'.format('Rank', 'Name', 'Sum', 'Mean', 'Median', 'Stddev'))
    for idx, score in enumerate(scores):
        print('{0:4} | {1:30} | {2:8.3f} | {3:5.3f} | {4:6.3f} | {5:6.3f}'.
              format(idx + 1, score['name'], score['sum'], score['mean'], score['median'], score['stddev']))

if __name__ == '__main__':
    main()
