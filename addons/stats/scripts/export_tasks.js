'use strict';
const commander = require('commander');
const fs = require('fs');
const db = require('../schemas');
const TaskExporter = require('../models/task_exporter');

// output = [{projectId, projectName, tasks}]
// tasks = {taskId, cost, actualWorkTime(minutes), userId} (ordered by completedAt)

commander
    .option('-p, --projects [projectNames]', '(required) Target project names (e.g., aaa.bbb,ccc)')
    .option('-o, --output [path]', 'Output file path (default: stdout)')
    .option('--pretty', 'Output pretty format (default: false)')
    .parse(process.argv);


if (!commander.projects) {
    process.stderr.write(this.helpInformation());
    process.exit(1);
}

const projectNames = commander.projects.split(',').map(x => x.trim());
const output = commander.output;
const pretty = commander.pretty;

db.coTransaction({}, function* (transaction) {
    let projectIds = [];
    for (let projectName of projectNames) {
        const project = yield db.Project.findOne({where: {name: projectName}, transaction});
        if (!project) { throw new Error(`${projectName} was not found`); }
        projectIds.push(project.id);
    }
    return TaskExporter.exportAll(projectIds);
})
    .then(res => {
        const outstr = JSON.stringify(res, null, pretty ? '  ' : '');
        if (output) {
            fs.writeFileSync(output, outstr);
            console.log(`Created ${output}`);
        } else {
            // res.forEach(x => console.log(x.projectName, x.tasks.length));
            console.log(outstr);
        }
    })
    .catch(e => console.error(e));
