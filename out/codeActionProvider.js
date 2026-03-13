"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGuardCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
class CodeGuardCodeActionProvider {
    static providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];
    provideCodeActions(document, range, context) {
        const codeguardDiagnostics = context.diagnostics.filter(diag => diag.source === 'CodeGuard AI');
        if (codeguardDiagnostics.length === 0) {
            return [];
        }
        const actions = [];
        for (const diagnostic of codeguardDiagnostics) {
            // Add "Analyze with AI" as the primary action
            const analyzeAction = new vscode.CodeAction('🤖 Analyze with AI for cost optimization', vscode.CodeActionKind.QuickFix);
            analyzeAction.command = {
                command: 'codeguard.analyzeWithAI',
                title: 'Analyze with AI',
                arguments: [document, range]
            };
            analyzeAction.diagnostics = [diagnostic];
            analyzeAction.isPreferred = true;
            actions.push(analyzeAction);
            // Add specific quick fixes based on diagnostic code
            const quickFixes = this.getQuickFixes(diagnostic, document, range);
            actions.push(...quickFixes);
        }
        return actions;
    }
    getQuickFixes(diagnostic, document, range) {
        const fixes = [];
        switch (diagnostic.code) {
            case 'dynamodb-provisioned':
                fixes.push(this.createReplaceAction('💡 Fix: Replace with PAY_PER_REQUEST', document, diagnostic.range, '"PROVISIONED"', '"PAY_PER_REQUEST"', diagnostic));
                break;
            case 'lambda-memory':
                fixes.push(this.createReplaceInLineAction('💡 Fix: Reduce to 512MB', document, diagnostic.range, /memory_size\s*=\s*\d+/, 'memory_size = 512', diagnostic), this.createReplaceInLineAction('💡 Fix: Reduce to 256MB', document, diagnostic.range, /memory_size\s*=\s*\d+/, 'memory_size = 256', diagnostic));
                break;
            case 'ec2-instance-size':
                // Extract current instance type from diagnostic range
                const currentInstance = document.getText(diagnostic.range);
                const instanceMatch = currentInstance.match(/"(t3\.large|t3\.xlarge|t3\.2xlarge|m5\.large|m5\.xlarge)"/);
                if (instanceMatch) {
                    const suggestedSize = this.getSuggestedInstanceSize(instanceMatch[1]);
                    fixes.push(this.createReplaceAction(`💡 Fix: Change to ${suggestedSize}`, document, diagnostic.range, currentInstance, `"${suggestedSize}"`, diagnostic));
                }
                break;
            case 'rds-instance-size':
                const currentRDS = document.getText(diagnostic.range);
                const rdsMatch = currentRDS.match(/"(db\.t3\.large|db\.t3\.xlarge|db\.m5\.large|db\.m5\.xlarge|db\.r5\.large)"/);
                if (rdsMatch) {
                    fixes.push(this.createReplaceAction('💡 Fix: Change to db.t4g.micro (ARM, cheaper)', document, diagnostic.range, currentRDS, '"db.t4g.micro"', diagnostic), this.createReplaceAction('💡 Fix: Change to db.t4g.small', document, diagnostic.range, currentRDS, '"db.t4g.small"', diagnostic));
                }
                break;
            case 'ebs-volume-type':
                fixes.push(this.createReplaceAction('💡 Fix: Change to gp3 (20% cheaper)', document, diagnostic.range, '"gp2"', '"gp3"', diagnostic));
                break;
            case 'cloudwatch-retention':
                fixes.push(this.createReplaceAction('💡 Fix: Set retention to 7 days', document, diagnostic.range, 'retention_in_days = 0', 'retention_in_days = 7', diagnostic), this.createReplaceAction('💡 Fix: Set retention to 30 days', document, diagnostic.range, 'retention_in_days = 0', 'retention_in_days = 30', diagnostic));
                break;
            case 's3-storage-class':
                fixes.push(this.createReplaceAction('💡 Fix: Change to STANDARD_IA (45% cheaper)', document, diagnostic.range, '"STANDARD"', '"STANDARD_IA"', diagnostic), this.createReplaceAction('💡 Fix: Change to GLACIER (75% cheaper)', document, diagnostic.range, '"STANDARD"', '"GLACIER"', diagnostic));
                break;
            case 'rds-multi-az':
                fixes.push(this.createReplaceAction('💡 Fix: Disable Multi-AZ (50% cost reduction)', document, diagnostic.range, 'multi_az = true', 'multi_az = false', diagnostic));
                break;
            case 'ec2-detailed-monitoring':
                fixes.push(this.createReplaceAction('💡 Fix: Disable detailed monitoring', document, diagnostic.range, 'monitoring = true', 'monitoring = false', diagnostic));
                break;
            case 'nat-gateway-cost':
            case 'alb-cost':
            case 'eip-unattached':
            case 'ebs-volume-size':
            case 'rds-storage-size':
                // These require architectural changes, show info only
                fixes.push(this.createInfoAction('💡 Suggestion: Use "Analyze with AI" for alternatives', diagnostic));
                break;
        }
        return fixes;
    }
    createReplaceAction(title, document, diagnosticRange, searchText, replacement, diagnostic) {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        const edit = new vscode.WorkspaceEdit();
        // Find the exact position of searchText within the diagnostic range
        const lineText = document.getText(diagnosticRange);
        const replaceRange = diagnosticRange;
        edit.replace(document.uri, replaceRange, replacement);
        action.edit = edit;
        return action;
    }
    createReplaceInLineAction(title, document, diagnosticRange, searchPattern, replacement, diagnostic) {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        // Find the line containing the diagnostic
        const line = document.lineAt(diagnosticRange.start.line);
        const lineText = line.text;
        const match = lineText.match(searchPattern);
        if (match) {
            const edit = new vscode.WorkspaceEdit();
            const startPos = new vscode.Position(line.lineNumber, lineText.indexOf(match[0]));
            const endPos = new vscode.Position(line.lineNumber, lineText.indexOf(match[0]) + match[0].length);
            const replaceRange = new vscode.Range(startPos, endPos);
            edit.replace(document.uri, replaceRange, replacement);
            action.edit = edit;
        }
        return action;
    }
    createInfoAction(title, diagnostic) {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        return action;
    }
    getSuggestedInstanceSize(currentSize) {
        const downsizeMap = {
            't3.2xlarge': 't3.xlarge',
            't3.xlarge': 't3.large',
            't3.large': 't3.medium',
            'm5.xlarge': 'm5.large',
            'm5.large': 't3.medium'
        };
        return downsizeMap[currentSize] || 't3.micro';
    }
}
exports.CodeGuardCodeActionProvider = CodeGuardCodeActionProvider;
//# sourceMappingURL=codeActionProvider.js.map