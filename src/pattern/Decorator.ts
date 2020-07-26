import * as vscode from 'vscode';
import { LogPattern } from './LogPattern';
import { RadiumConstants } from '../util/RadiumConstants';

export class Decorator {
    private _configLogPatterns: LogPattern[];
    private _cache: Map<vscode.Uri, Map<LogPattern, vscode.DecorationOptions[]>>;

    public constructor() {
        this._configLogPatterns = [];
        this._cache = new Map<vscode.Uri, Map<LogPattern, vscode.DecorationOptions[]>>();
    }

    public dispose() {
        for (const pattern of this._configLogPatterns) {
            pattern.dispose();
        }

        this._cache.forEach((cache) => {
            for (const pattern of cache.keys()) {
                pattern.dispose();
            }
        });
    }

    public updateConfigs(): void {
        const configLogPatterns = vscode.workspace
            .getConfiguration(RadiumConstants.CONFIG_RADIUM)
            .get(RadiumConstants.CONFIG_HIGHLIGHT) as {
            name: string;
            pattern: string;
            color?: string;
            highlight?: string;
            tooltip?: string;
        }[];

        for (const p of this._configLogPatterns) {
            p.dispose();
        }

        this._configLogPatterns = [];
        for (const i of configLogPatterns) {
            if (
                (i.color !== undefined || i.highlight !== undefined || i.tooltip !== undefined) &&
                i.name !== undefined &&
                i.pattern !== undefined
            ) {
                this._configLogPatterns.push(new LogPattern(i.name, i.pattern, i.color, i.highlight, i.tooltip));
            }
        }
    }

    public decorateDoc(event: vscode.TextDocumentChangeEvent): void {
        if (this._configLogPatterns.length === 0 || event.contentChanges.length === 0) {
            return;
        }

        const doc = event.document;
        const editors = vscode.window.visibleTextEditors.filter((editor) => {
            return editor.document.fileName === doc.fileName;
        });

        const change = event.contentChanges
            .slice()
            .sort((a, b) => Math.abs(a.range.start.line - b.range.start.line))[0];
        const startPos = new vscode.Position(change.range.start.line, 0);
        const docCache = this._cache.get(doc.uri);

        const content: string = doc.getText(new vscode.Range(startPos, doc.lineAt(doc.lineCount - 1).range.end));
        for (const log of this._configLogPatterns) {
            const patternCache = docCache?.get(log);

            const options = patternCache?.filter((option) => {
                return option.range.end.isBefore(change.range.start);
            });

            for (const regex of log.regExpressions) {
                let matches = regex.exec(content);
                while (matches) {
                    const start = doc.positionAt(doc.offsetAt(startPos) + matches.index);
                    const end = start.translate(0, matches[0].length);
                    options?.push({
                        hoverMessage: log.tooltip!,
                        range: new vscode.Range(start, end),
                    });

                    matches = regex.exec(content);
                }
            }

            docCache?.set(log, options!);
            editors[0].setDecorations(log.decoration, options!);
        }

        this._cache.set(doc.uri, docCache!);
    }

    public decorateEditors(editors: vscode.TextEditor[], events?: vscode.TextDocumentChangeEvent[]): void {
        if (editors.length >= 1) {
            for (const editor of editors) {
                const content = editor.document.getText();
                const options = new Map<LogPattern, vscode.DecorationOptions[]>();

                for (const log of this._configLogPatterns) {
                    const decorationOptions: vscode.DecorationOptions[] = [];
                    for (const regex of log.regExpressions) {
                        let matches = regex.exec(content);

                        while (matches) {
                            const start = editor.document.positionAt(matches.index);
                            const end = start.translate(0, matches[0].length);

                            decorationOptions.push({
                                hoverMessage: log.tooltip!,
                                range: new vscode.Range(start, end),
                            });

                            matches = regex.exec(content);
                        }
                    }

                    options.set(log, decorationOptions);
                    editor.setDecorations(log.decoration, decorationOptions);
                }

                this._cache.set(editor.document.uri, options);
            }
        }
    }
}
