// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { Decorator } from './pattern/Decorator';
import { Controller } from './pattern/Controller';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Radium extension is activated');

    const patternDecorator = new Decorator();
    const patternController = new Controller(patternDecorator);

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(patternController);
}

// this method is called when your extension is deactivated
export function deactivate() {}
