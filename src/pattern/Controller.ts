import * as vscode from 'vscode';
import { Decorator } from './Decorator';
import { RadiumConstants } from '../util/RadiumConstants';

export class Controller {
    private _disposable: vscode.Disposable;
    private _decorator: Decorator;

    public constructor(decorator: Decorator) {
        this._decorator = decorator;
        const subscriptions: vscode.Disposable[] = [];

        vscode.workspace.onDidChangeConfiguration(
            () => {
                this.onDidChangeConfiguration();
            },
            this,
            subscriptions
        );
        vscode.workspace.onDidChangeTextDocument(
            (event) => {
                this.onDidChangeTextDocument(event);
            },
            this,
            subscriptions
        );
        vscode.window.onDidChangeVisibleTextEditors(
            (editors) => {
                this.onDidChangeVisibleTextEditors(editors);
            },
            this,
            subscriptions
        );

        this._disposable = vscode.Disposable.from(...subscriptions);
        this.onDidChangeConfiguration();
    }

    public dispose() {
        this._disposable.dispose();
        this._decorator.dispose();
    }

    private onDidChangeConfiguration(): void {
        this._decorator.updateConfigs();
        const editors = vscode.window.visibleTextEditors.filter((editor) => {
            return editor.document.languageId === RadiumConstants.RADIUM_LOG_ID;
        });

        if (editors.length !== 0) {
            this._decorator.decorateEditors(editors);
        }
    }

    private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
        if (event.document.languageId === RadiumConstants.RADIUM_LOG_ID) {
            this._decorator.decorateDoc(event);
        }
    }

    private onDidChangeVisibleTextEditors(txtEditors: vscode.TextEditor[]): void {
        const editors = txtEditors.filter((editor) => {
            return editor.document.languageId === RadiumConstants.RADIUM_LOG_ID;
        });

        if (editors.length !== 0) {
            this._decorator.decorateEditors(editors);
        }
    }
}
