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
            const quickFix = this.getQuickFix(diagnostic, document, range);
            if (quickFix) {
                actions.push(quickFix);
            }
        }
        return actions;
    }
    getQuickFix(diagnostic, document, range) {
        switch (diagnostic.code) {
            case 'dynamodb-provisioned':
                return this.createReplaceAction('💡 Replace with PAY_PER_REQUEST', document, range, 'PROVISIONED', 'PAY_PER_REQUEST', diagnostic);
            case 'lambda-memory':
                return this.createReplaceAction('💡 Reduce to 256MB', document, range, /memory_size\s*=\s*\d+/, 'memory_size = 256', diagnostic);
            case 'ec2-instance-size':
                return this.createInfoAction('💡 Suggestion: Use t3.micro for dev/test', diagnostic);
            case 'nat-gateway-cost':
                return this.createInfoAction('💡 Suggestion: Use VPC Endpoints instead', diagnostic);
            default:
                return null;
        }
    }
    createReplaceAction(title, document, range, searchPattern, replacement, diagnostic) {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        const line = document.lineAt(range.start.line);
        const lineText = line.text;
        const newText = lineText.replace(searchPattern, replacement);
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(document.uri, new vscode.Range(range.start.line, 0, range.start.line, lineText.length), newText);
        return action;
    }
    createInfoAction(title, diagnostic) {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        return action;
    }
}
exports.CodeGuardCodeActionProvider = CodeGuardCodeActionProvider;
//# sourceMappingURL=codeActionProvider.js.map