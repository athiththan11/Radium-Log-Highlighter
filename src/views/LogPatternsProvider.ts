import * as vscode from 'vscode';
import { LogPattern } from './LogPattern';

export class LogPatternsProvider implements vscode.TreeDataProvider<LogPattern> {
    private _onDidChangeTreeData: vscode.EventEmitter<LogPattern | undefined | void> = new vscode.EventEmitter<
        LogPattern | undefined | void
    >();
    readonly onDidChangeTreeData: vscode.Event<LogPattern | undefined | void> = this._onDidChangeTreeData.event;
    private readonly _configLogPatterns: { name: string; pattern: string; tooltip?: string }[];

    constructor() {
        this._configLogPatterns = vscode.workspace.getConfiguration('radium').get('highlight') as {
            name: string;
            pattern: string;
            tooltip?: string;
        }[];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: LogPattern): vscode.TreeItem {
        return element;
    }

    getChildren(element?: LogPattern): Thenable<LogPattern[]> {
        // if (!this.workspaceRoot) {
        //     vscode.window.showInformationMessage('No dependency in empty workspace');
        //     return Promise.resolve([]);
        // }
        // if (element) {
        //     return Promise.resolve(
        //         this.getDepsInPackageJson(
        //             path.join(this.workspaceRoot, 'node_modules', element.pattern, 'package.json')
        //         )
        //     );
        // } else {
        //     const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        //     if (this.pathExists(packageJsonPath)) {
        //         return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
        //     } else {
        //         vscode.window.showInformationMessage('Workspace has no package.json');
        //         return Promise.resolve([]);
        //     }
        // }

        if (element) {
            vscode.window.showInformationMessage(element.tooltip);
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.getDepsInPackageJson());
        }
    }

    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    private getDepsInPackageJson(): LogPattern[] {
        const deps = this._configLogPatterns.map((log) => {
            return new LogPattern(log.name, log.pattern, vscode.TreeItemCollapsibleState.Collapsed, log.tooltip);
        });
        return deps;
    }
}
