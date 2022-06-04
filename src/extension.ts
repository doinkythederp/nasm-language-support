import { ExtensionContext } from 'vscode';
import * as path from 'node:path';
import {
    LanguageClient,
    LanguageClientOptions,
    NodeModule,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';


let client: LanguageClient;
export async function activate(ctx: ExtensionContext) {
    const serverPath = ctx.asAbsolutePath(path.join('dist', 'server.js'));

    const run: NodeModule = {
        module: serverPath,
        transport: TransportKind.ipc
    };
    const serverOpts: ServerOptions = {
        run,
        debug: {
            ...run,
            options: { execArgv: ['--nolazy', '--inspect=6009'] }
        }
    };

    const clientOpts: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'nasm' }]
    };

    client = new LanguageClient(
        'nasmValidator',
        'NASM Assembly Validator',
        serverOpts,
        clientOpts
    );

    await client.start();
}

export async function deactivate() {
    if (!client) return;
    await client.stop();
}
