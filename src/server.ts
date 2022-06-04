import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    TextDocumentChangeEvent
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import * as childProcess from 'node:child_process';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { writeFile } from 'node:fs/promises';
import * as assert from 'node:assert/strict';

import { parseStream } from './parse-nasm-output';
import { mkdirSync } from 'node:fs';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
    const { capabilities } = params;

    hasWorkspaceFolderCapability = Boolean(capabilities.workspace?.workspaceFolders);

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }

    return result;
});

/**
 * Converts a 1-indexed line number to the range of indexes that emcompasses the line.
 */
function lineToRange(text: string, line: number): [number, number] {
    const lines = text.split('\n');
    if (line > lines.length) throw new Error(`Line ${line} is out of bounds`);

    const start = lines.slice(0, line - 1).join('\n').length + 1;
    const end = start + lines[line - 1]!.length;
    return [start, end];
}

const temp = path.join(tmpdir(), 'nasmValidator');
try {
    mkdirSync(temp);
} catch (e) {
    if ((e as { code: string; }).code !== 'EEXIST') throw e;
}

function spawn(command: string, args: string[]) {
    let child = childProcess.spawn(command, args);
    return new Promise<childProcess.ChildProcessWithoutNullStreams>((resolve, reject) => {
        child.on('error', reject);
        child.on('spawn', () => resolve(child));
    });
}

async function validateAssembly(document: TextDocument) {
    connection.console.info('validating source code');
    const text = document.getText();

    const sourceFileName = 'in.asm';
    const source = path.join(temp, sourceFileName);
    await writeFile(source, text);

    connection.console.info(`wrote source file to ${source}, spawning nasm`);

    const nasm = await spawn('nasm', ['-o', path.join(temp, 'out.o'), source]);
    const diagnostics: Diagnostic[] = (await parseStream(sourceFileName, nasm.stderr, connection)).map((diagnostic) => {
        const [start, end] = lineToRange(text, diagnostic.line);
        return {
            message: diagnostic.message,
            range: {
                start: document.positionAt(start),
                end: document.positionAt(end)
            },
            severity: diagnostic.isWarning ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
            source: 'nasm'
        };
    });

    connection.console.log(`finished calculating ${diagnostics.length} diagnostics, sending`);

    connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

const checkChange = (change: TextDocumentChangeEvent<TextDocument>) => {
    validateAssembly(change.document).catch((e) => connection.console.error(String(e)));
};

documents.onDidSave(checkChange);
documents.onDidOpen(checkChange);

documents.listen(connection);
connection.listen();
