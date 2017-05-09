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
    .option('-t, --type [type]', 'Output type (json or tsv) (default: json)', /^(json|tsv)$/, 'json')
    .option('--pretty', 'Output pretty format (default: false)')
    .option('--header', 'Add header in tsv (default: false)')
    .parse(process.argv);


if (!commander.projects) {
    process.stderr.write(commander.helpInformation());
    process.exit(1);
}

const projectNames = commander.projects.split(',').map(x => x.trim());
const output = commander.output;
const outputType = commander.type;
const pretty = commander.pretty;
const header = commander.header;

db.transaction(async transaction => {
    let projectIds = [];
    for (let projectName of projectNames) {
        const project = await db.Project.findOne({where: {name: projectName}, transaction});
        if (!project) { throw new Error(`${projectName} was not found`); }
        projectIds.push(project.id);
    }
    return await TaskExporter.exportAll(projectIds);
})
    .then(res => {
        const outstr = {
            json: toJSON.bind(null, res),
            tsv: toTSV.bind(null, res, header)
        }[outputType]();

        if (output) {
            fs.writeFileSync(output, outstr);
            console.log(`Created ${output}`);
        } else {
            // res.forEach(x => console.log(x.projectName, x.tasks.length));
            console.log(outstr);
        }
    })
    .catch(e => console.error(e));

function toJSON (projects) {
    return JSON.stringify(projects, null, pretty ? '  ' : '');
}

function toTSV (projects, header) {
    if (!projects.length || !projects[0].tasks.length) {
        return '';
    }

    const lines = [];
    const keys1 = Object.keys(projects[0]).filter(key => key !== 'tasks');
    const keys2 = Object.keys(projects[0].tasks[0]);
    const keys = keys1.concat(keys2);

    if (header) {
        lines.push(keys);
    }

    projects.forEach(project => {
        const line0 = keys1.map(key => project[key]);
        project.tasks.forEach(task => {
            const line = line0.concat(keys2.map(key => task[key]));
            lines.push(line);
        });
    });

    return lines.map(xs => xs.join('\t')).join('\n');
}
