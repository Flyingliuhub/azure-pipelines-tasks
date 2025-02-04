let fs = require("fs");
let os = require("os");
import * as tl from "azure-pipelines-task-lib";
import child = require("child_process");
import stream = require("stream");
import {IExecOptions, IExecSyncResult} from "azure-pipelines-task-lib/toolrunner";

export interface IClientToolOptions {
    clientToolFilePath: string;
    expirationInDays: string;
    indexableFileFormats: string;
    personalAccessToken: string;
    requestName: string;
    symbolServiceUri: string;
}

export function getOptions(): IExecOptions{
    let result: IExecOptions = <IExecOptions>{
        cwd: process.cwd(),
        env: Object.assign({}, process.env),
        silent: false,
        failOnStdErr: false,
        ignoreReturnCode: false,
        windowsVerbatimArguments: false
    };
    result.outStream = process.stdout as stream.Writable;
    result.errStream = process.stderr as stream.Writable;
    return result;
}

function getCommandString(toolPath: string, command: string[]){
    let cmd: string = toolPath;
    command.forEach((a: string): void => {
        cmd += ` ${a}`;
    });
    return cmd;
}

export function runClientTool(clientToolPath: string, command: string[], execOptions: IExecOptions): IExecSyncResult{

    if (tl.osType() === "Windows_NT" || clientToolPath.trim().toLowerCase().endsWith(".exe")) {
        return tl.execSync(clientToolPath, command, execOptions);
    }
    else{
        fs.chmodSync(clientToolPath, "755");

        if (!execOptions.silent) {
            execOptions.outStream.write(getCommandString(clientToolPath, command) + os.EOL);
        }

        let result = child.spawnSync(clientToolPath, command, execOptions);

        if (!execOptions.silent && result.stdout && result.stdout.length > 0) {
            execOptions.outStream.write(result.stdout);
        }

        if (!execOptions.silent && result.stderr && result.stderr.length > 0) {
            execOptions.errStream.write(result.stderr);
        }

        let res: IExecSyncResult = <IExecSyncResult>{ code: result.status, error: result.error };
        res.stdout = (result.stdout) ? result.stdout.toString() : null;
        res.stderr = (result.stderr) ? result.stderr.toString() : null;
        return res;
    }
}
