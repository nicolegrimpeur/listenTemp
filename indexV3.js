import * as util from "node:util";
import {exec} from 'node:child_process';
import http from 'node:http';

const asyncExec = util.promisify(exec);

const port = 9101;

const server = http.createServer(async (req, res) => {
    let result;
    const tabResult = [];

    const { stdout: stdoutCPU, stderr: stderrCPU } = await asyncExec("sensors");

    if (stderrCPU) {
        result = "-1";
    } else {
        result = stdoutCPU.match(/([+\-])\d+\.*\d*°C/gm)[0];
        result = result.slice(0, -2);
    }

    tabResult.push({
        name: "tempCPU",
        value: result
    });

    const { stdout: stdoutHDD, stderr: stderrHDD } = await asyncExec("smartctl -A /dev/sda | grep -i temperature");

    if (stderrHDD) {
        result = "-1";
    } else {
        result = stdoutHDD.split(' ').pop();
        result = "+" + result;
    }

    tabResult.push({
        name: "tempHDD",
        value: result
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');

    res.end(tabResult.map((item) => {
        return item.name + " " + item.value;
    }).join("\n"));
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
