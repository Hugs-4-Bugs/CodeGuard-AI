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
exports.ResultsPanel = void 0;
const vscode = __importStar(require("vscode"));
class ResultsPanel {
    static show(context, resourceBlock, analysis) {
        const panel = vscode.window.createWebviewPanel('codeguardAnalysis', '🤖 CodeGuard AI Cost Analysis', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = this.getWebviewContent(resourceBlock, analysis);
    }
    static getWebviewContent(resourceBlock, analysis) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeGuard AI Analysis</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 32px;
            line-height: 1.6;
        }
        
        /* ============================================
           RESPONSIVE HEADER - NO OVERLAP GUARANTEED
           ============================================ */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px;
            border-radius: 16px;
            margin-bottom: 32px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        /* Flexbox container with wrap enabled */
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px; /* Space between items when side-by-side */
            flex-wrap: wrap; /* Allow wrapping on small screens */
        }
        
        /* Title section - grows to take available space */
        .header-title {
            flex: 1 1 auto;
            min-width: 200px; /* Minimum width before wrapping */
        }
        
        .header-title h1 {
            font-size: 28px;
            margin-bottom: 8px;
            line-height: 1.2;
        }
        
        .header-title p {
            opacity: 0.9;
            font-size: 14px;
        }
        
        /* Badge section - stays right-aligned when space allows */
        .header-badge {
            flex: 0 0 auto; /* Don't grow, don't shrink, auto width */
            align-self: flex-start; /* Align to top */
        }
        
        .confidence-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap; /* Prevent text wrapping inside badge */
            display: inline-block;
        }
        
        .confidence-high {
            background: rgba(78, 201, 176, 0.3);
            border: 2px solid #4ec9b0;
        }
        
        .confidence-medium {
            background: rgba(255, 193, 7, 0.3);
            border: 2px solid #ffc107;
        }
        
        .confidence-low {
            background: rgba(244, 135, 113, 0.3);
            border: 2px solid #f48771;
        }
        
        /* Small screens: Stack vertically */
        @media (max-width: 500px) {
            .header-content {
                flex-direction: column;
            }
            
            .header-badge {
                align-self: flex-start; /* Left-align on mobile */
            }
        }
        
        /* ============================================
           COST COMPARISON CARDS - RESPONSIVE GRID
           ============================================ */
        .cost-comparison {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }
        
        .cost-card {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            transition: transform 0.2s;
        }
        
        .cost-card:hover {
            transform: translateY(-4px);
        }
        
        .cost-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.7;
            margin-bottom: 12px;
        }
        
        .cost-value {
            font-size: 28px;
            font-weight: bold;
            word-break: break-word;
        }
        
        .cost-value.savings {
            color: #4ec9b0;
        }
        
        /* ============================================
           CONTENT SECTIONS
           ============================================ */
        .recommendation {
            background: var(--vscode-inputValidation-infoBackground);
            border-left: 4px solid #0078d4;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 32px;
        }
        
        .recommendation h2 {
            margin-bottom: 16px;
            color: var(--vscode-textLink-foreground);
            font-size: 20px;
        }
        
        .recommendation p {
            line-height: 1.7;
        }
        
        .important-notes {
            background: #ffc10733;
            border-left: 4px solid #ffc107;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 32px;
        }
        
        .important-notes h2 {
            color: #ffc107;
            margin-bottom: 16px;
            font-size: 20px;
        }
        
        .important-notes p {
            margin-bottom: 12px;
            font-weight: 500;
            line-height: 1.6;
        }
        
        .important-notes p:last-child {
            margin-bottom: 0;
        }
        
        .section {
            margin-bottom: 32px;
        }
        
        .section.warning {
            background: var(--vscode-inputValidation-warningBackground);
            border-left: 4px solid var(--vscode-inputValidation-warningBorder);
            padding: 24px;
            border-radius: 8px;
        }
        
        .section h2, .section h3 {
            margin-bottom: 16px;
            color: var(--vscode-textLink-foreground);
            font-size: 20px;
        }
        
        .checklist {
            list-style: none;
            padding-left: 0;
        }
        
        .checklist li {
            padding: 8px 0;
            font-size: 15px;
            line-height: 1.6;
        }
        
        /* ============================================
           PROS/CONS & WHEN SECTIONS - RESPONSIVE
           ============================================ */
        .pros-cons, .when-sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }
        
        .pros, .cons, .when-use, .when-not-use {
            background: var(--vscode-input-background);
            padding: 24px;
            border-radius: 12px;
            border: 1px solid var(--vscode-input-border);
        }
        
        .pros h3 {
            color: #4ec9b0;
            margin-bottom: 16px;
            font-size: 18px;
        }
        
        .cons h3 {
            color: #f48771;
            margin-bottom: 16px;
            font-size: 18px;
        }
        
        .when-use h2 {
            color: #4ec9b0;
            margin-bottom: 16px;
            font-size: 18px;
        }
        
        .when-not-use h2 {
            color: #f48771;
            margin-bottom: 16px;
            font-size: 18px;
        }
        
        .pros ul, .cons ul {
            list-style: none;
            padding-left: 0;
        }
        
        .pros li, .cons li {
            padding: 8px 0;
            line-height: 1.5;
        }
        
        .pros li::before {
            content: "✓ ";
            color: #4ec9b0;
            font-weight: bold;
            margin-right: 8px;
            font-size: 18px;
        }
        
        .cons li::before {
            content: "⚠ ";
            margin-right: 8px;
            font-size: 16px;
        }
        
        /* ============================================
           CODE BLOCKS
           ============================================ */
        pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 20px;
            border-radius: 12px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.5;
            margin: 16px 0;
            border: 1px solid var(--vscode-input-border);
        }
        
        /* ============================================
           BUTTONS
           ============================================ */
        .copy-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 12px;
            transition: all 0.2s;
        }
        
        .copy-button:hover {
            background: var(--vscode-button-hoverBackground);
            transform: translateY(-2px);
        }
        
        .copy-button:active {
            transform: translateY(0);
        }
        
        .divider {
            height: 1px;
            background: var(--vscode-input-border);
            margin: 32px 0;
        }
        
        /* ============================================
           MOBILE OPTIMIZATIONS
           ============================================ */
        @media (max-width: 600px) {
            body {
                padding: 16px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header-title h1 {
                font-size: 22px;
            }
            
            .cost-value {
                font-size: 24px;
            }
            
            .cost-comparison {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="header-title">
                <h1>🤖 AI Cost Optimization Analysis</h1>
                <p>Powered by AWS Bedrock (Claude 3.5)</p>
            </div>
            ${analysis.confidence ? `
            <div class="header-badge">
                <div class="confidence-badge confidence-${analysis.confidence}">
                    Confidence: ${analysis.confidence.toUpperCase()}
                </div>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="cost-comparison">
        <div class="cost-card">
            <div class="cost-label">Current Cost</div>
            <div class="cost-value">${analysis.currentCost}</div>
        </div>
        <div class="cost-card">
            <div class="cost-label">Optimized Cost</div>
            <div class="cost-value">${analysis.optimizedCost}</div>
        </div>
        <div class="cost-card">
            <div class="cost-label">Annual Savings</div>
            <div class="cost-value savings">${analysis.annualSavings}</div>
        </div>
    </div>

    ${analysis.importantNotes && analysis.importantNotes.length > 0 ? `
    <div class="important-notes">
        <h2>🚨 Important - Read Before Proceeding</h2>
        ${analysis.importantNotes.map(note => `<p>${note}</p>`).join('')}
    </div>
    ` : ''}

    <div class="recommendation">
        <h2>💡 Recommendation</h2>
        <p>${analysis.recommendation}</p>
    </div>

    ${(analysis.whenToUse && analysis.whenToUse.length > 0) || (analysis.whenNotToUse && analysis.whenNotToUse.length > 0) ? `
    <div class="when-sections">
        ${analysis.whenToUse && analysis.whenToUse.length > 0 ? `
        <div class="when-use">
            <h2>✅ When to Use This Approach</h2>
            <ul class="checklist">
                ${analysis.whenToUse.map(item => `<li>✓ ${item}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        ${analysis.whenNotToUse && analysis.whenNotToUse.length > 0 ? `
        <div class="when-not-use">
            <h2>⛔ When NOT to Use This Approach</h2>
            <ul class="checklist">
                ${analysis.whenNotToUse.map(item => `<li>✗ ${item}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="pros-cons">
        <div class="pros">
            <h3>✓ Pros</h3>
            <ul>
                ${analysis.pros.map(pro => `<li>${pro}</li>`).join('')}
            </ul>
        </div>
        <div class="cons">
            <h3>⚠ Considerations</h3>
            <ul>
                ${analysis.cons.map(con => `<li>${con}</li>`).join('')}
            </ul>
        </div>
    </div>

    ${analysis.alternativeTerraform ? `
    <div class="divider"></div>
    
    <div class="section">
        <h3>📝 Optimized Terraform Code</h3>
        <pre>${this.escapeHtml(analysis.alternativeTerraform)}</pre>
        <button class="copy-button" onclick="copyCode()">📋 Copy to Clipboard</button>
    </div>
    ` : ''}

    <div class="divider"></div>

    <div class="section">
        <h3>📄 Your Current Configuration</h3>
        <pre>${this.escapeHtml(resourceBlock)}</pre>
    </div>

    <script>
        function copyCode() {
            const code = ${JSON.stringify(analysis.alternativeTerraform || '')};
            navigator.clipboard.writeText(code);
            
            const btn = document.querySelector('.copy-button');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            btn.style.background = '#4ec9b0';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }
    </script>
</body>
</html>`;
    }
    static escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
exports.ResultsPanel = ResultsPanel;
//# sourceMappingURL=resultsPanel.js.map