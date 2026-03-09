import * as vscode from 'vscode';

export class CodeGuardCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        const codeguardDiagnostics = context.diagnostics.filter(
            diag => diag.source === 'CodeGuard AI'
        );

        if (codeguardDiagnostics.length === 0) {
            return [];
        }

        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of codeguardDiagnostics) {
            // Add "Analyze with AI" as the primary action
            const analyzeAction = new vscode.CodeAction(
                '🤖 Analyze with AI for cost optimization',
                vscode.CodeActionKind.QuickFix
            );
            analyzeAction.command = {
                command: 'codeguard.analyzeWithAI',
                title: 'Analyze with AI',
                arguments: [document, range]
            };
            analyzeAction.diagnostics = [diagnostic];
            analyzeAction.isPreferred = true;
            actions.push(analyzeAction);

            // Add specific quick fixes based on diagnostic code
            const quickFix = this.getQuickFix(diagnostic, document, range);
            if (quickFix) {
                actions.push(quickFix);
            }
        }

        return actions;
    }

    private getQuickFix(
        diagnostic: vscode.Diagnostic,
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction | null {
        switch (diagnostic.code) {
            case 'dynamodb-provisioned':
                return this.createReplaceAction(
                    '💡 Replace with PAY_PER_REQUEST',
                    document,
                    range,
                    'PROVISIONED',
                    'PAY_PER_REQUEST',
                    diagnostic
                );

            case 'lambda-memory':
                return this.createReplaceAction(
                    '💡 Reduce to 256MB',
                    document,
                    range,
                    /memory_size\s*=\s*\d+/,
                    'memory_size = 256',
                    diagnostic
                );

            case 'ec2-instance-size':
                return this.createInfoAction(
                    '💡 Suggestion: Use t3.micro for dev/test',
                    diagnostic
                );

            case 'nat-gateway-cost':
                return this.createInfoAction(
                    '💡 Suggestion: Use VPC Endpoints instead',
                    diagnostic
                );

            default:
                return null;
        }
    }

    private createReplaceAction(
        title: string,
        document: vscode.TextDocument,
        range: vscode.Range,
        searchPattern: string | RegExp,
        replacement: string,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];

        const line = document.lineAt(range.start.line);
        const lineText = line.text;
        const newText = lineText.replace(searchPattern, replacement);

        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(
            document.uri,
            new vscode.Range(range.start.line, 0, range.start.line, lineText.length),
            newText
        );

        return action;
    }

    private createInfoAction(title: string, diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        return action;
    }
}