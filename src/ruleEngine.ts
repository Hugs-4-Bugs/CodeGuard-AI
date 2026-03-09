import * as vscode from 'vscode';

export interface CostRule {
    pattern: RegExp;
    message: string;
    severity: vscode.DiagnosticSeverity;
    code: string;
    estimatedMonthlyCost?: string;
}

export class RuleEngine {
    private rules: CostRule[] = [
        {
            pattern: /aws_nat_gateway/g,
            message: "💰 NAT Gateway costs ~$32/month. Click 💡 for alternatives.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "nat-gateway-cost",
            estimatedMonthlyCost: "$32"
        },
        {
            pattern: /billing_mode\s*=\s*"PROVISIONED"/g,
            message: "⚠️ DynamoDB provisioned mode can be 5-10x more expensive. Click 💡 for optimization.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "dynamodb-provisioned",
            estimatedMonthlyCost: "$23-47"
        },
        {
            pattern: /memory_size\s*=\s*(1024|1536|2048|3008)/g,
            message: "📊 High Lambda memory increases costs 4–8x. Click 💡 to optimize.",
            severity: vscode.DiagnosticSeverity.Information,
            code: "lambda-memory",
            estimatedMonthlyCost: "$13"
        },
        {
            pattern: /instance_type\s*=\s*"(t3\.large|t3\.xlarge|t3\.2xlarge|m5\.large|m5\.xlarge)"/g,
            message: "💸 Large EC2 instance detected. Click 💡 for smaller alternatives.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "ec2-instance-size",
            estimatedMonthlyCost: "$60+"
        }
    ];

    public analyze(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        for (const rule of this.rules) {
            let match;
            const regex = new RegExp(rule.pattern);
            
            while ((match = regex.exec(text))) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);

                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(startPos, endPos),
                    rule.message,
                    rule.severity
                );

                diagnostic.source = "CodeGuard AI";
                diagnostic.code = rule.code;
                diagnostics.push(diagnostic);
            }
        }

        return diagnostics;
    }
}