import * as assert from 'node:assert/strict';
import { createConnection } from 'vscode-languageserver/node';


enum ReadStage {
    Filename,
    LineNumber,
    Severity,
    Message
}


export interface Diagnostic {
    line: number,
    isWarning: boolean,
    message: string;
}

const linePattern = /:(\d+): (\w+): (.+)$/;

export async function parseStream(filename: string, stream: AsyncIterable<string>, connection: ReturnType<typeof createConnection>): Promise<Diagnostic[]> {
    connection.console.info(`Parsing diagnostics from ${filename}`);
    const diagnostics: Diagnostic[] = [];

    let readBuf = '';

    for await (const chunk of stream) {
        readBuf += chunk;

        const lines = readBuf.split('\n');
        readBuf = lines.pop()!;

        for (const line of lines) {
            const match = linePattern.exec(line);
            if (!match) {
                connection.console.warn(`Could not parse diagnostic: ${line}`);
                continue;
            }

            const [, lineNumber, severity, message] = match;
            const diagnostic: Diagnostic = {
                line: Number(lineNumber),
                isWarning: severity === 'warning',
                message: message!
            };

            connection.console.info(`Parsed ${severity} diagnostic on line ${lineNumber} with message "${message}"`);

            diagnostics.push({
                line: Number(lineNumber),
                isWarning: severity === 'warning',
                message: message!
            });
        }
    }

    return diagnostics;
}
