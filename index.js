import {exec} from 'child_process';
import http from 'http';

const port = 9101;

const server = http.createServer((req, res) => {
    exec("sensors", (error, stdout, stderr) => {
        let result;
        if (error || stderr) {
            result = "-1";
            return;
        } else {
            result = stdout.match(/(\+|-)\d+\.*\d*°C/gm)[0];
            result = result.slice(0, -2);
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end("temp " + result);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
