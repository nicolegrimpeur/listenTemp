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
            const regex = /Core \d+:\s*(\+|-)\d+.\d°C/gm;
            result = stdout.match(regex);
            result = result.map((item, index) => {
                return "core" + index + " " + item.match(/(\+|-)\d+.\d/gm)[0];
            }).join("\n");
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(result);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
