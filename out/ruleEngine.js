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
        // ============================================
        // ORIGINAL 4 RULES
        // ============================================
        {
            pattern: /aws_nat_gateway/g,
            message: "💰 NAT Gateway costs ~$32/month. Click 💡 for alternatives.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "nat-gateway-cost",
            estimatedMonthlyCost: "$32"
        },
        {
            pattern: /"PROVISIONED"/g,
            message: "⚠️ DynamoDB provisioned mode can be 5-10x more expensive. Click 💡 for optimization.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "dynamodb-provisioned",
            estimatedMonthlyCost: "$23-47"
        },
        {
            pattern: /\b(1024|1536|2048|3008)\b/g,
            message: "📊 High Lambda memory increases costs 4–8x. Click 💡 to optimize.",
            severity: vscode.DiagnosticSeverity.Information,
            code: "lambda-memory",
            estimatedMonthlyCost: "$13"
        },
        {
            pattern: /"(t3\.large|t3\.xlarge|t3\.2xlarge|m5\.large|m5\.xlarge)"/g,
            message: "💸 Large EC2 instance detected. Click 💡 for smaller alternatives.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "ec2-instance-size",
            estimatedMonthlyCost: "$60+"
        },
        // ============================================
        // NEW RULE 1: RDS Instance Sizes
        // ============================================
        {
            pattern: /instance_class\s*=\s*"(db\.t3\.large|db\.t3\.xlarge|db\.m5\.large|db\.m5\.xlarge|db\.r5\.large)"/g,
            message: "💾 Large RDS instance detected. Consider db.t4g.micro or db.t4g.small for dev/test ($15-30/month vs $120+/month).",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "rds-instance-size",
            estimatedMonthlyCost: "$120+"
        },
        // ============================================
        // NEW RULE 2: EBS Volume Type (gp2 → gp3)
        // ============================================
        {
            pattern: /type\s*=\s*"gp2"/g,
            message: "💿 EBS gp2 volume detected. Switch to gp3 for 20% cost savings with same performance.",
            severity: vscode.DiagnosticSeverity.Information,
            code: "ebs-volume-type",
            estimatedMonthlyCost: "20% savings"
        },
        // ============================================
        // NEW RULE 3: Large EBS Volumes
        // ============================================
        {
            pattern: /size\s*=\s*(500|1000|2000|5000)/g,
            message: "💿 Large EBS volume detected. Verify you need this size - oversized volumes waste $50-500/month.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "ebs-volume-size",
            estimatedMonthlyCost: "$50-500"
        },
        // ============================================
        // NEW RULE 4: Application Load Balancer
        // ============================================
        {
            pattern: /aws_lb\s/g,
            message: "⚖️ Application Load Balancer costs ~$22/month. Consider API Gateway for simple APIs ($3.50/million requests).",
            severity: vscode.DiagnosticSeverity.Information,
            code: "alb-cost",
            estimatedMonthlyCost: "$22"
        },
        // ============================================
        // NEW RULE 5: Unattached Elastic IP
        // ============================================
        {
            pattern: /aws_eip"[^{]*\{[^}]*(?!instance\s*=)[^}]*\}/gs,
            message: "🔌 Elastic IP without attached instance costs $3.60/month. Attach to instance or release it.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "eip-unattached",
            estimatedMonthlyCost: "$3.60"
        },
        // ============================================
        // NEW RULE 6: CloudWatch Logs Retention
        // ============================================
        {
            pattern: /retention_in_days\s*=\s*0/g,
            message: "📝 CloudWatch Logs with infinite retention. Set to 7-30 days to save costs ($0.50/GB/month).",
            severity: vscode.DiagnosticSeverity.Information,
            code: "cloudwatch-retention",
            estimatedMonthlyCost: "$0.50/GB"
        },
        // ============================================
        // BONUS RULE 7: S3 Standard for Archive Data
        // ============================================
        {
            pattern: /storage_class\s*=\s*"STANDARD"/g,
            message: "🗄️ S3 STANDARD class detected. For infrequent access, use STANDARD_IA (45% cheaper) or GLACIER (75% cheaper).",
            severity: vscode.DiagnosticSeverity.Information,
            code: "s3-storage-class",
            estimatedMonthlyCost: "45-75% savings"
        },
        // ============================================
        // BONUS RULE 8: Large RDS Storage
        // ============================================
        {
            pattern: /allocated_storage\s*=\s*(500|1000|2000)/g,
            message: "💾 Large RDS storage allocation. Start smaller and enable autoscaling to avoid overprovisioning.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "rds-storage-size",
            estimatedMonthlyCost: "$50-200"
        },
        // ============================================
        // BONUS RULE 9: Multi-AZ RDS in Dev/Test
        // ============================================
        {
            pattern: /multi_az\s*=\s*true/g,
            message: "🔄 Multi-AZ RDS doubles costs (~$240/month). Only use for production, not dev/test.",
            severity: vscode.DiagnosticSeverity.Warning,
            code: "rds-multi-az",
            estimatedMonthlyCost: "$240+"
        },
        // ============================================
        // BONUS RULE 10: EC2 Detailed Monitoring
        // ============================================
        {
            pattern: /monitoring\s*=\s*true/g,
            message: "📊 EC2 detailed monitoring costs $2.10/month per instance. Use basic monitoring unless needed.",
            severity: vscode.DiagnosticSeverity.Information,
            code: "ec2-detailed-monitoring",
            estimatedMonthlyCost: "$2.10/instance"
        }
    ];
    analyze(document) {
        const diagnostics = [];
        const text = document.getText();
        for (const rule of this.rules) {
            let match;
            const regex = new RegExp(rule.pattern);
            // Special handling for memory_size rule (only flag in Lambda context)
            if (rule.code === 'lambda-memory') {
                const lines = text.split('\n');
                lines.forEach((line, lineIndex) => {
                    if (line.includes('memory_size')) {
                        const memMatch = line.match(/\b(1024|1536|2048|3008)\b/);
                        if (memMatch) {
                            const lineStart = text.split('\n').slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
                            const matchIndex = lineStart + line.indexOf(memMatch[0]);
                            const startPos = document.positionAt(matchIndex);
                            const endPos = document.positionAt(matchIndex + memMatch[0].length);
                            const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos), rule.message, rule.severity);
                            diagnostic.source = "CodeGuard AI";
                            diagnostic.code = rule.code;
                            diagnostics.push(diagnostic);
                        }
                    }
                });
            }
            else {
                // Standard pattern matching for all other rules
                while ((match = regex.exec(text))) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos), rule.message, rule.severity);
                    diagnostic.source = "CodeGuard AI";
                    diagnostic.code = rule.code;
                    diagnostics.push(diagnostic);
                }
            }
        }
        return diagnostics;
    }
    getRuleByCode(code) {
        return this.rules.find(rule => rule.code === code);
    }
    getAllRules() {
        return this.rules;
    }
}
exports.RuleEngine = RuleEngine;
//# sourceMappingURL=ruleEngine.js.map