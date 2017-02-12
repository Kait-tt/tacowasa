# coding:utf-8
import json
from statistics import mean, stdev, median

import argparse
import matplotlib.pyplot as plt
import predictors
import math

method = predictors.AveragePredictorEachCostInterval
project_names = ['tacowasa']
COLORS = ['green', 'blue', 'red']


def main():
    parser = argparse.ArgumentParser(description='Test interval prediction')
    parser.add_argument('-s', '--src', required=True)
    args = parser.parse_args()

    projects = json.load(open(args.src, 'r'))

    # filter project
    # if len(project_names):
    #     projects = [x for x in projects if x['projectName'] in project_names]

    results = calc_all(projects, method)

    # filter if same user and same cost tasks were over 3
    # for project in projects:
    #     result = [x for x in results if x['projectName'] == project['projectName']][0]
    #     tasks = []
    #     predicates = []
    #     actuals = []
    #     memo = {}
    #     for i in range(len(project['tasks'])):
    #         task = project['tasks'][i]
    #         key = '{}_{}'.format(task['cost'], task['userId'])
    #         if key not in memo:
    #             memo[key] = 0
    #         if memo[key] <= 3:
    #             tasks.append(task)
    #             predicates.append(result['predicates'][i])
    #             actuals.append(result['actuals'][i])
    #         memo[key] += 1
    #
    #     project['tasks'] = tasks
    #     result['predicates'] = predicates
    #     result['actuals'] = actuals

    print_results_table(projects, results)
    # plot_hist(projects, results)
    # plot_timeline(projects, results)


def calc_all(projects, method):
    results = []

    for project in projects:
        print('load : {}'.format(project['projectName']))

        tasks = []
        predicates = []
        actuals = []
        for task in project['tasks']:
            predicate = method.predicate(tasks, task['userId'], task['cost'])

            if predicate[0] is None:
                predicates.append((0, 0, 0, 0, 0))
            else:
                predicates.append(predicate)

            actuals.append(task['actualWorkTime'])
            tasks.append(task)

        results.append({'projectName': project['projectName'], 'predicates': predicates, 'actuals': actuals})

    return results


def uniq_users(project):
    return list(set([x['userId'] for x in project['tasks']]))


def uniq_all_users(projects):
    users = []
    for project in projects:
        users.extend(uniq_users(project))
    return list(set(users))


def uniq_all_cost(projects):
    cost = []
    for project in projects:
        for task in project['tasks']:
            cost.append(task['cost'])
    return list(set(cost))


def plot_hist(projects, results):
    ucost = uniq_all_cost(projects)
    es = {}
    for cost in ucost:
        es[cost] = []

    for project in projects:
        tasks = project['tasks']
        result = [x for x in results if x['projectName'] == project['projectName']][0]
        predicates = result['predicates']
        actuals = result['actuals']

        for i in range(len(tasks)):
            e = min(abs(predicates[i][0] - actuals[i]) / actuals[i], 10)
            y = predicates[i]
            x = actuals[i]
            # e = 0 if y[1] <= x <= y[2] else min(10, abs(y[1] - x) / x, abs(y[2] - x) / x)
            # e = 0 if y[3] <= x <= y[4] else min(10, abs(y[3] - x) / x, abs(y[4] - x) / x)
            es[tasks[i]['cost']].append(e)

    plt.hist(es.values(), normed=True)
    plt.show()


def plot_timeline(projects, results):
    users = uniq_all_users(projects)
    costs = uniq_all_cost(projects)
    n = sum([len(uniq_users(x)) for x in projects])
    m = math.floor(math.sqrt(n))
    r = math.floor(n / m)
    c = math.floor((n + r - 1) / r)
    idx = 0

    for pi, project in enumerate(projects):
        project_name = project['projectName']
        tasks = project['tasks']
        result = [x for x in results if x['projectName'] == project_name][0]
        predicates = result['predicates']
        actuals = result['actuals']

        for ui, user in enumerate(users):
            ymax, xmax = 0, 0
            if len([i for i in range(len(tasks)) if tasks[i]['userId'] == user]) > 0:
                idx += 1

            for ci, cost in enumerate(costs):
                idxes = [i for i in range(len(tasks)) if tasks[i]['userId'] == user and tasks[i]['cost'] == cost]
                if len(idxes) == 0:
                    continue

                xs = [predicates[i] for i in idxes]
                means = [x[0] for x in xs]
                mlows = [x[0] - x[1] for x in xs]
                mhighs = [x[2] - x[0] for x in xs]
                lows = [x[0] - x[3] for x in xs]
                highs = [x[4] - x[0] for x in xs]
                xs2 = [actuals[i] for i in idxes]
                # es = [min(abs(predicates[i][0] - actuals[i]) / actuals[i], 10) for i in idxes]
                # es = [
                #     0 if xs[i][3] <= xs2[i] <= xs[i][4]
                #     else min(10, abs(xs[i][3] - xs2[i]) / xs2[i], abs(xs[i][4] - xs2[i]) / xs2[i])
                #     for i in range(len(idxes))
                # ]

                xmax = max(xmax, len(xs))

                plt.subplot(r, c, idx)
                plt.xlim(-1, xmax + 1)
                # plt.ylim(0, 11)
                plt.title('{} {}'.format(project_name, user), fontsize=10)
                # plt.plot(xs2, color=COLORS[ci])
                plt.scatter(range(len(xs2)), xs2, marker='o', color=COLORS[ci], s=10,
                            label='Actual_Cost{}'.format(cost))
                plt.errorbar(range(len(means)), means, yerr=[mlows, mhighs], color=COLORS[ci],
                             elinewidth=2, label='Predict_Cost{}'.format(cost))
                # plt.errorbar(range(len(means)), means, yerr=[lows, highs], color=COLORS[ci])
                # plt.scatter(range(len(means)), xs2, marker='o', color=COLORS[ci], s=10)
                plt.legend()

    plt.show()


def print_results_table(projects, results):
    data = []
    total_es = []
    total_ins = []
    total_ws = []
    cost_es = {1: [], 3: [], 5: []}
    cost_ins = {1: [], 3: [], 5: []}
    cost_ws = {1: [], 3: [], 5: []}
    for project in projects:
        project_name = project['projectName']
        tasks = project['tasks']
        result = [x for x in results if x['projectName'] == project_name][0]
        predicates = result['predicates']
        actuals = result['actuals']
        project_es = []
        project_ins = []
        project_ws = []

        for user in uniq_all_users(projects):
            for cost in uniq_all_cost(projects):
                idxes = [i for i in range(len(tasks)) if tasks[i]['userId'] == user and tasks[i]['cost'] == cost]
                if len(idxes) < 2:
                    continue

                es = [abs(predicates[i][0] - actuals[i]) / actuals[i] for i in idxes]
                ins = [predicates[i][1] <= actuals[i] <= predicates[i][2] for i in idxes]
                ws = [float(predicates[i][2] - predicates[i][1]) for i in idxes]
                project_es.extend(es)
                project_ins.extend(ins)
                project_ws.extend(ws)
                cost_es[cost].extend(es)
                cost_ins[cost].extend(ins)
                cost_ws[cost].extend(ws)
                total_es.extend(es)
                total_ins.extend(ins)
                total_ws.extend(ws)

                data.append({
                    'name': '{} ({}, {})'.format(project_name, user, cost),
                    'es': es,
                    'ins': ins,
                    'ws': ws
                })

        data.append({
            'name': '{}'.format(project_name),
            'es': project_es,
            'ins': project_ins,
            'ws': project_ws
        })

    for cost in [1, 3, 5]:
        data.append({
            'name': 'Cost {}'.format(cost),
            'es': cost_es[cost],
            'ins': cost_ins[cost],
            'ws': cost_ws[cost]
        })

    data.append({
        'name': 'Total',
        'es': total_es,
        'ins': total_ins,
        'ws': total_ws
    })

    scores = []
    for x in data:
        es = x['es']
        ins = x['ins']
        ws = x['ws']
        scores.append({
            'name': x['name'],
            'sum': sum(es),
            'mean': mean(es) if len(es) > 0 else 0.0,
            'stddev': stdev(es) if len(es) >= 2 else 0.0,
            'median': median(es) if len(es) > 0 else 0.0,
            'cover': ins.count(True),
            'uncover': ins.count(False),
            'coverp': float(ins.count(True)) / len(ins) if len(ins) > 0 else 0.0,
            'wmean': mean(ws) if len(ws) > 0 else 0.0
        })

    print('{:25} | {:8} | {:7} | {:7} | {:7} | {:5} | {:7} | {:7} | {:7}'
          .format('Name', 'Sum', 'Mean', 'Median', 'Stddev', 'Cover', 'Uncover', 'CoverP', 'WMean'))
    for idx, score in enumerate(scores):
        print('{:25} | {:8.3f} | {:7.3f} | {:7.3f} | {:7.3f} | {:5} | {:7} | {:7.3} | {:7.4}'.
              format(score['name'], score['sum'], score['mean'], score['median'], score['stddev'],
                     score['cover'], score['uncover'], score['coverp'], score['wmean']))


if __name__ == '__main__':
    main()
