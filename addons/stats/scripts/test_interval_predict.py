# coding:utf-8
import json
import argparse
import matplotlib.pyplot as plt
import predictors
import math

method = predictors.AveragePredictorEachCostInterval
without_project_names = []
COLORS = ['green', 'blue', 'red']


def main():
    parser = argparse.ArgumentParser(description='Test interval prediction')
    parser.add_argument('-s', '--src', required=True)
    args = parser.parse_args()

    projects = json.load(open(args.src, 'r'))

    # filter project
    projects = [x for x in projects if x['projectName'] not in without_project_names]

    # remove outliers
    for project in projects:
        project['tasks'] = [x for x in project['tasks'] if x['actualWorkTime'] < 60 * 10]

    results = calc_all(projects, method)
    plot_timeline(projects, results)


def calc_all(projects, method):
    results = []

    for project in projects:
        print('load : {}'.format(project['projectName']))

        tasks = []
        predicates = []
        actuals = []
        for task in project['tasks']:
            predicate = method.predicate(tasks, task['userId'], task['cost'])
            tasks.append(task)

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

                xmax = max(xmax, len(xs))

                plt.subplot(r, c, idx)
                plt.xlim(-1, xmax + 1)
                plt.title('{} {}'.format(project_name, user), fontsize=10)
                plt.errorbar(range(len(means)), means, yerr=[mlows, mhighs], color=COLORS[ci], elinewidth=2)
                plt.errorbar(range(len(means)), means, yerr=[lows, highs], color=COLORS[ci])
                plt.scatter(range(len(means)), xs2, marker='o', color=COLORS[ci], s=10)


    plt.show()


if __name__ == '__main__':
    main()
