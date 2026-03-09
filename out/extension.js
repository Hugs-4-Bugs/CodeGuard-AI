"use strict";
// import * as vscode from 'vscode';
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
exports.activate = activate;
exports.deactivate = deactivate;
// let diagnosticCollection: vscode.DiagnosticCollection;
// let analysisTimer: ReturnType<typeof setTimeout> | undefined;
// const DEBOUNCE_DELAY = 1000; // 1 second - user has stopped typing
// export function activate(context: vscode.ExtensionContext) {
//     console.log('🚀 CodeGuard AI activated');
//     // Create diagnostic collection
//     diagnosticCollection = vscode.languages.createDiagnosticCollection('codeguard');
//     context.subscriptions.push(diagnosticCollection);
//     // Show confirmation (only once)
//     vscode.window.showInformationMessage('✅ CodeGuard AI is now protecting your AWS infrastructure');
//     // Manual command for testing
//     context.subscriptions.push(
//         vscode.commands.registerCommand('codeguard.analyze', () => {
//             const editor = vscode.window.activeTextEditor;
//             if (editor && isTerraformFile(editor.document)) {
//                 analyzeDocument(editor.document);
//                 vscode.window.showInformationMessage('CodeGuard: Analysis complete');
//             }
//         })
//     );
//     // Analyze currently open file (only if it exists)
//     if (vscode.window.activeTextEditor) {
//         const doc = vscode.window.activeTextEditor.document;
//         if (isTerraformFile(doc)) {
//             analyzeDocument(doc);
//         }
//     }
//     // CRITICAL: Debounced analysis on typing (don't interrupt!)
//     context.subscriptions.push(
//         vscode.workspace.onDidChangeTextDocument(event => {
//             const document = event.document;
//             // Only analyze if it's a Terraform file
//             if (!isTerraformFile(document)) {
//                 return;
//             }
//             // Cancel any pending analysis
//             if (analysisTimer) {
//                 clearTimeout(analysisTimer);
//             }
//             // Schedule new analysis (only runs after user stops typing)
//             analysisTimer = setTimeout(() => {
//                 analyzeDocument(document);
//             }, DEBOUNCE_DELAY);
//         })
//     );
//     // IMMEDIATE analysis on save (explicit user action - not disruptive)
//     context.subscriptions.push(
//         vscode.workspace.onDidSaveTextDocument(document => {
//             if (isTerraformFile(document)) {
//                 // Cancel any pending debounced analysis
//                 if (analysisTimer) {
//                     clearTimeout(analysisTimer);
//                 }
//                 // Analyze immediately
//                 analyzeDocument(document);
//             }
//         })
//     );
//     // Analyze when switching to a different file (no typing happening)
//     context.subscriptions.push(
//         vscode.window.onDidChangeActiveTextEditor(editor => {
//             if (editor && isTerraformFile(editor.document)) {
//                 analyzeDocument(editor.document);
//             }
//         })
//     );
//     // Clear diagnostics when file is closed
//     context.subscriptions.push(
//         vscode.workspace.onDidCloseTextDocument(document => {
//             diagnosticCollection.delete(document.uri);
//         })
//     );
//     console.log('✅ CodeGuard AI: Ready');
// }
// function isTerraformFile(document: vscode.TextDocument): boolean {
//     return document.fileName.endsWith('.tf') || 
//            document.fileName.endsWith('.tfvars') ||
//            document.languageId === 'terraform';
// }
// function analyzeDocument(document: vscode.TextDocument): void {
//     const diagnostics: vscode.Diagnostic[] = [];
//     const text = document.getText();
//     // Helper to create diagnostics safely
//     const addDiagnostic = (
//         match: RegExpExecArray,
//         message: string,
//         severity: vscode.DiagnosticSeverity,
//         code: string
//     ) => {
//         const startPos = document.positionAt(match.index);
//         const endPos = document.positionAt(match.index + match[0].length);
//         const diagnostic = new vscode.Diagnostic(
//             new vscode.Range(startPos, endPos),
//             message,
//             severity
//         );
//         diagnostic.source = "CodeGuard AI";
//         diagnostic.code = code;
//         diagnostics.push(diagnostic);
//     };
//     // NAT Gateway
//     const natRegex = /aws_nat_gateway/g;
//     let match;
//     while ((match = natRegex.exec(text))) {
//         addDiagnostic(
//             match,
//             "💰 NAT Gateway costs ~$32/month. Consider VPC endpoints.",
//             vscode.DiagnosticSeverity.Warning,
//             "nat-gateway-cost"
//         );
//     }
//     // DynamoDB PROVISIONED
//     const dynamoRegex = /billing_mode\s*=\s*"PROVISIONED"/g;
//     while ((match = dynamoRegex.exec(text))) {
//         addDiagnostic(
//             match,
//             "⚠️ DynamoDB provisioned mode can be 5-10x more expensive. Consider PAY_PER_REQUEST.",
//             vscode.DiagnosticSeverity.Warning,
//             "dynamodb-provisioned"
//         );
//     }
//     // Lambda high memory
//     const lambdaRegex = /memory_size\s*=\s*(1024|1536|2048|3008)/g;
//     while ((match = lambdaRegex.exec(text))) {
//         addDiagnostic(
//             match,
//             "📊 High Lambda memory allocation increases costs 4–8x. Start with 256–512MB.",
//             vscode.DiagnosticSeverity.Information,
//             "lambda-memory"
//         );
//     }
//     // Large EC2 instances
//     const ec2Regex = /instance_type\s*=\s*"(t3\.large|t3\.xlarge|t3\.2xlarge|m5\.large|m5\.xlarge)"/g;
//     while ((match = ec2Regex.exec(text))) {
//         addDiagnostic(
//             match,
//             `💸 ${match[1]} detected. Consider t3.micro or t3.small for dev/test.`,
//             vscode.DiagnosticSeverity.Warning,
//             "ec2-instance-size"
//         );
//     }
//     diagnosticCollection.set(document.uri, diagnostics);
// }
// export function deactivate() {
//     if (analysisTimer) {
//         clearTimeout(analysisTimer);
//     }
//     if (diagnosticCollection) {
//         diagnosticCollection.clear();
//         diagnosticCollection.dispose();
//     }
// }
const vscode = __importStar(require("vscode"));
const ruleEngine_1 = require("./ruleEngine");
const codeActionProvider_js_1 = require("./codeActionProvider.js");
const costAnalysisService_1 = require("./costAnalysisService");
const resultsPanel_js_1 = require("./resultsPanel.js");
let diagnosticCollection;
let ruleEngine;
let analysisService;
let analysisTimer;
const DEBOUNCE_DELAY = 1000;
function activate(context) {
    console.log('🚀 CodeGuard AI: Activating');
    // Initialize services
    diagnosticCollection = vscode.languages.createDiagnosticCollection('codeguard');
    ruleEngine = new ruleEngine_1.RuleEngine();
    analysisService = new costAnalysisService_1.CostAnalysisService();
    context.subscriptions.push(diagnosticCollection);
    vscode.window.showInformationMessage('✅ CodeGuard AI is now protecting your AWS infrastructure');
    // ========================================
    // COMMAND: Analyze with AI
    // ========================================
    context.subscriptions.push(vscode.commands.registerCommand('codeguard.analyzeWithAI', async (document, range) => {
        await analyzeWithAI(context, document, range);
    }));
    // ========================================
    // CODE ACTION PROVIDER (Quick Fixes)
    // ========================================
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ language: 'terraform', scheme: 'file' }, new codeActionProvider_js_1.CodeGuardCodeActionProvider(), {
        providedCodeActionKinds: codeActionProvider_js_1.CodeGuardCodeActionProvider.providedCodeActionKinds
    }));
    // ========================================
    // CODE LENS PROVIDER ("Analyze with AI" buttons)
    // ========================================
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'terraform', scheme: 'file' }, {
        provideCodeLenses(document) {
            return provideCodeLenses(document);
        }
    }));
    // ========================================
    // EVENT HANDLERS
    // ========================================
    // Analyze current file on activation
    if (vscode.window.activeTextEditor) {
        const doc = vscode.window.activeTextEditor.document;
        if (isTerraformFile(doc)) {
            analyzeDocument(doc);
        }
    }
    // Debounced analysis on typing
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        const document = event.document;
        if (!isTerraformFile(document))
            return;
        if (analysisTimer)
            clearTimeout(analysisTimer);
        analysisTimer = setTimeout(() => {
            analyzeDocument(document);
            // Refresh CodeLens after analysis
            vscode.commands.executeCommand('codeguard.refreshCodeLens');
        }, DEBOUNCE_DELAY);
    }));
    // Immediate analysis on save
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
        if (isTerraformFile(document)) {
            if (analysisTimer)
                clearTimeout(analysisTimer);
            analyzeDocument(document);
            vscode.commands.executeCommand('codeguard.refreshCodeLens');
        }
    }));
    // Analyze when switching files
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && isTerraformFile(editor.document)) {
            analyzeDocument(editor.document);
        }
    }));
    // Clear diagnostics on file close
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
        diagnosticCollection.delete(document.uri);
    }));
    // Command to refresh CodeLens
    context.subscriptions.push(vscode.commands.registerCommand('codeguard.refreshCodeLens', () => {
        // Trigger CodeLens refresh by changing active editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            vscode.languages.setTextDocumentLanguage(editor.document, 'terraform');
        }
    }));
    console.log('✅ CodeGuard AI: Ready');
}
function isTerraformFile(document) {
    return document.fileName.endsWith('.tf') ||
        document.fileName.endsWith('.tfvars') ||
        document.languageId === 'terraform';
}
function analyzeDocument(document) {
    const diagnostics = ruleEngine.analyze(document);
    diagnosticCollection.set(document.uri, diagnostics);
}
function provideCodeLenses(document) {
    const codeLenses = [];
    const text = document.getText();
    // Find all expensive resources
    const expensivePatterns = [
        { pattern: /resource\s+"aws_nat_gateway"\s+"[^"]+"/g, type: 'nat' },
        { pattern: /billing_mode\s*=\s*"PROVISIONED"/g, type: 'dynamodb' },
        { pattern: /instance_type\s*=\s*"(t3\.large|t3\.xlarge|m5\.large)"/g, type: 'ec2' },
        { pattern: /memory_size\s*=\s*(1024|2048|3008)/g, type: 'lambda' }
    ];
    expensivePatterns.forEach(({ pattern, type }) => {
        let match;
        while ((match = pattern.exec(text))) {
            const pos = document.positionAt(match.index);
            const line = document.lineAt(pos.line);
            const range = new vscode.Range(pos.line, 0, pos.line, line.text.length);
            const codeLens = new vscode.CodeLens(range, {
                title: "🤖 Analyze with CodeGuard-AI",
                command: "codeguard.analyzeWithAI",
                arguments: [document, range],
                tooltip: "Get AI-powered cost optimization suggestions"
            });
            codeLenses.push(codeLens);
        }
    });
    return codeLenses;
}
async function analyzeWithAI(context, document, range) {
    const resourceBlock = extractResourceBlock(document, range.start);
    if (!resourceBlock) {
        vscode.window.showWarningMessage('Could not identify Terraform resource');
        return;
    }
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🤖 Analyzing with AI...",
        cancellable: false
    }, async (progress) => {
        progress.report({ message: "Calling AWS Bedrock..." });
        try {
            const analysis = await analysisService.analyze(resourceBlock);
            resultsPanel_js_1.ResultsPanel.show(context, resourceBlock, analysis);
        }
        catch (error) {
            vscode.window.showErrorMessage(`AI Analysis failed: ${error}`);
        }
    });
}
function extractResourceBlock(document, position) {
    const text = document.getText();
    const lines = text.split('\n');
    let startLine = -1;
    let endLine = -1;
    let braceCount = 0;
    // Search backwards for "resource"
    for (let i = position.line; i >= 0; i--) {
        if (lines[i].trim().startsWith('resource ')) {
            startLine = i;
            break;
        }
    }
    if (startLine === -1)
        return null;
    // Search forwards for closing brace
    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        if (braceCount === 0 && i > startLine) {
            endLine = i;
            break;
        }
    }
    if (endLine === -1)
        return null;
    return lines.slice(startLine, endLine + 1).join('\n');
}
function deactivate() {
    if (analysisTimer)
        clearTimeout(analysisTimer);
    if (diagnosticCollection) {
        diagnosticCollection.clear();
        diagnosticCollection.dispose();
    }
}
//# sourceMappingURL=extension.js.map