import * as util from "node:util";
import {exec} from 'node:child_process';
import http from 'node:http';
import nodemailer from "nodemailer";
import {env} from "./env.js";

const port = 9101;

const asyncExec = util.promisify(exec);

// informations de connexion pour le mail
const transport = nodemailer.createTransport({
    host: env.OVH_MAIL_HOST,
    port: env.OVH_MAIL_PORT,
    auth: {
        user: env.OVH_MAIL_USER,
        pass: env.OVH_MAIL_PWD
    },
    tls: {
        rejectUnauthorized: false
    },
});

let lastMailSentTime = 0; // Variable pour stocker l'heure du dernier envoi de mail

const server = http.createServer(async (req, res) => {
    let resultCPU, resultHDD;
    const tabResult = [];
    const currentTime = Date.now();

    const { stdout: stdoutCPU, stderr: stderrCPU } = env.ENV !== "dev" ?
        await asyncExec("sensors") :
        {stdout: "+70.0°C", stderr: null};

    if (stderrCPU) {
        resultCPU = "-1";
    } else {
        resultCPU = stdoutCPU.match(/([+\-])\d+\.*\d*°C/gm)[0];
        resultCPU = resultCPU.slice(0, -2);
    }

    tabResult.push({
        name: "tempCPU",
        value: resultCPU
    });

    const { stdout: stdoutHDD, stderr: stderrHDD } = env.ENV !== "dev" ?
        await asyncExec("smartctl -A /dev/sda | grep -i temperature") :
        {stdout: "50", stderr: null};

    if (stderrHDD) {
        resultHDD = "-1";
    } else {
        resultHDD = stdoutHDD.split(' ').pop();
        resultHDD = "+" + resultHDD;
    }

    tabResult.push({
        name: "tempHDD",
        value: resultHDD
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');

    res.end(tabResult.map((item) => {
        return item.name + " " + item.value;
    }).join("\n"));

    // condition pour envoyer un mail si la température du CPU ou du HDD est supérieure à la température limite
    if (currentTime - lastMailSentTime >= env.MAIL_SEND_INTERVAL * 60 * 1000 &&
        (parseFloat(resultCPU) > env.CPU_TEMPORATURE_THRESHOLD || parseFloat(resultHDD) > env.HDD_TEMPORATURE_THRESHOLD)) {
        await sendMail(resultCPU, resultHDD);
        lastMailSentTime = currentTime; // Update the last mail sent time
    }
});

// permet de récupérer les informations du mail et d'envoyer le mail
export async function sendMail(tempCPU, tempHDD) {
    // on récupère le mail aux formats HTML et text
    const html = `<h1>Alerte température</h1>
                  <p>La température du CPU est de ${tempCPU}°C (seuil : ${env.CPU_TEMPORATURE_THRESHOLD}°C)</p>
                  <p>La température du HDD est de ${tempHDD}°C (seuil : ${env.HDD_TEMPORATURE_THRESHOLD}°C)</p>`;
    const text = `Alerte température\n
    La température du CPU est de ${tempCPU}°C (seuil: ${env.CPU_TEMPORATURE_THRESHOLD}°C)\n
    La température du HDD est de ${tempHDD}°C (seuil: ${env.HDD_TEMPORATURE_THRESHOLD}°C)`;

    // option du mail
    const mailOptions = {
        from: env.MAIL_FROM,
        to: env.MAIL_TO,
        subject: "Alerte température nicob.ovh",
        html,
        text
    };

    await transport.sendMail(mailOptions);

    // fermeture de la connexion
    transport.close();
}

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
