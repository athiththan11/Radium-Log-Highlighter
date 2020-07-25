import * as vscode from 'vscode';

export class LogPattern extends vscode.TreeItem {
    constructor(
        public readonly name: string,
        private pattern: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        private message?: string
    ) {
        super(name, collapsibleState);
    }

    get tooltip(): string {
        return this.name;
    }

    get description(): string {
        return this.message!;
    }
}
