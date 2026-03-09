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
exports.RuleEngine = void 0;
const vscode = __importStar(require("vscode"));
class RuleEngine {
    rules = [
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
    analyze(document) {
        const diagnostics = [];
        const text = document.getText();
        for (const rule of this.rules) {
            let match;
            const regex = new RegExp(rule.pattern);
            while ((match = regex.exec(text))) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos), rule.message, rule.severity);
                diagnostic.source = "CodeGuard AI";
                diagnostic.code = rule.code;
                diagnostics.push(diagnostic);
            }
        }
        return diagnostics;
    }
}
exports.RuleEngine = RuleEngine;
//# sourceMappingURL=ruleEngine.js.map