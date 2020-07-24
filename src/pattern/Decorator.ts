import * as vscode from 'vscode';
import LogPattern = require('./LogPattern');

class Decorator {
    private _configLogPatterns: LogPattern[];
    private _cache: Map<vscode.Uri, Map<LogPattern, vscode.DecorationOptions[]>>;
    // private _cache: Map<vscode.Uri, Map<LogPattern, vscode.Range[]>>;

    private readonly RADIUM: string = 'radium';
    private readonly HIGHLIGHT: string = 'highlight';

    public constructor() {
        this._configLogPatterns = [];
        this._cache = new Map<vscode.Uri, Map<LogPattern, vscode.DecorationOptions[]>>();
        // this._cache = new Map<vscode.Uri, Map<LogPattern, vscode.Range[]>>();
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
        const configLogPatterns = vscode.workspace.getConfiguration(this.RADIUM).get(this.HIGHLIGHT) as {
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
                i.pattern !== undefined
            ) {
                this._configLogPatterns.push(new LogPattern(i.pattern, i.color, i.highlight, i.tooltip));
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

            // const ranges = patternCache?.filter((range) => {
            //     return range.end.isBefore(change.range.start);
            // });

            const options = patternCache?.filter((option) => {
                return option.range.end.isBefore(change.range.start);
            });

            for (const regex of log.regExpressions) {
                let matches = regex.exec(content);
                while (matches) {
                    const start = doc.positionAt(doc.offsetAt(startPos) + matches.index);
                    const end = start.translate(0, matches[0].length);
                    // ranges?.push(new vscode.Range(start, end));
                    options?.push({
                        hoverMessage: log.tooltip!,
                        range: new vscode.Range(start, end),
                    });

                    matches = regex.exec(content);
                }
            }

            docCache?.set(log, options!);
            editors[0].setDecorations(log.decoration, options!);
            // docCache?.set(log, ranges!);
            // editors[0].setDecorations(log.decoration, ranges!);
        }

        this._cache.set(doc.uri, docCache!);
    }

    public decorateEditors(editors: vscode.TextEditor[], events?: vscode.TextDocumentChangeEvent[]): void {
        if (editors.length >= 1) {
            for (const editor of editors) {
                const content = editor.document.getText();
                const options = new Map<LogPattern, vscode.DecorationOptions[]>();
                // const ranges = new Map<LogPattern, vscode.Range[]>();

                for (const log of this._configLogPatterns) {
                    // const logRanges = [];
                    const decorationOptions: vscode.DecorationOptions[] = [];
                    for (const regex of log.regExpressions) {
                        let matches = regex.exec(content);

                        while (matches) {
                            const start = editor.document.positionAt(matches.index);
                            const end = start.translate(0, matches[0].length);
                            // logRanges.push(new vscode.Range(start, end));

                            decorationOptions.push({
                                hoverMessage: log.tooltip!,
                                range: new vscode.Range(start, end),
                            });

                            matches = regex.exec(content);
                        }
                    }

                    options.set(log, decorationOptions);
                    editor.setDecorations(log.decoration, decorationOptions);
                    // ranges.set(log, logRanges);
                    // editor.setDecorations(log.decoration, logRanges);
                }

                this._cache.set(editor.document.uri, options);
            }
        }
    }
}

export = Decorator;
