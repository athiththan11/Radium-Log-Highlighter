import * as vscode from 'vscode';

export class LogPattern {
    public readonly pattern: string;
    public readonly color?: string;
    public readonly highlight?: string;
    public readonly tooltip?: string;

    public readonly regExpressions: RegExp[];
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(pattern: string, color?: string, highlight?: string, tooltip?: string) {
        this.pattern = pattern;
        this.color = color;
        this.highlight = highlight;
        this.tooltip = tooltip;

        this.regExpressions = this.createRegExpressions(pattern);
        this.decoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.highlight,
            color: this.color,
            overviewRulerLane: vscode.OverviewRulerLane.Center,
            overviewRulerColor: this.highlight,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });
    }

    public dispose() {
        this.decoration.dispose();
    }

    /**
     * method to create regular expressions with the provided pattern
     *
     * @private
     * @param {string} pattern log pattern
     * @returns {RegExp[]}
     * @memberof LogPattern
     */
    private createRegExpressions(pattern: string): RegExp[] {
        const expressions: RegExp[] = [];

        if (!/^\w+$/g.test(pattern)) {
            try {
                expressions.push(new RegExp(pattern, 'gm'));
            } catch (err) {
                vscode.window.showErrorMessage('Regex pattern is invalid. Error: ' + err);
            }
        } else {
            const first = new RegExp('\\b(?!\\[)(' + pattern.toUpperCase() + '|' + pattern + ')(?!\\]|\\:)\\b', 'gm');
            const second = new RegExp('\\[(' + pattern + ')\\]|\\b(' + pattern + ')\\:', 'ig');
            expressions.push(first, second);
        }

        return expressions;
    }
}
