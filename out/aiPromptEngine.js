"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIPromptEngine = void 0;
class AIPromptEngine {
    /**
     * Generate a production-grade prompt for Bedrock
     */
    static generatePrompt(request) {
        const { context } = request;
        const systemPrompt = `You are a senior AWS solutions architect with 10+ years of experience in cost optimization and infrastructure design.

Your role is to analyze Terraform configurations and provide nuanced, production-safe recommendations.

CRITICAL REQUIREMENTS:
1. Always consider the full architectural context
2. Never recommend removing resources that may be required
3. Provide realistic cost ranges, not oversimplified figures
4. Include all necessary Terraform parameters
5. Explain conditions and trade-offs clearly
6. Flag when more context is needed

Your recommendations must be safe for production use.`;
        const userPrompt = this.buildUserPrompt(context);
        return JSON.stringify({
            system: systemPrompt,
            prompt: userPrompt,
            responseFormat: this.getResponseFormat()
        });
    }
    static buildUserPrompt(context) {
        const prompts = {
            'aws_nat_gateway': this.getNATGatewayPrompt(context),
            'aws_dynamodb_table': this.getDynamoDBPrompt(context),
            'aws_lambda_function': this.getLambdaPrompt(context),
            'aws_instance': this.getEC2Prompt(context),
            'aws_db_instance': this.getRDSPrompt(context)
        };
        return prompts[context.resourceType] || this.getGenericPrompt(context);
    }
    static getNATGatewayPrompt(context) {
        return `Analyze this NAT Gateway configuration:

\`\`\`terraform
${context.fullBlock}
\`\`\`

CONTEXT YOU MUST CONSIDER:
1. NAT Gateways are used for:
   - Outbound internet access from private subnets
   - Downloading packages, patches, updates
   - Accessing external APIs
   - Container image pulls
   - Accessing AWS services without VPC endpoints

2. Common architectural patterns:
   - Pattern A: NAT Gateway only for AWS service access (S3, DynamoDB)
     → Can be replaced with Gateway VPC Endpoints ($0/month)
   
   - Pattern B: NAT Gateway for internet access + AWS services
     → VPC Endpoints reduce traffic through NAT but NAT still needed
     → Hybrid approach: VPC Endpoints + NAT Gateway
   
   - Pattern C: NAT Gateway for outbound internet (APIs, downloads)
     → Cannot be removed without breaking functionality
     → Must analyze actual usage patterns

3. Cost considerations:
   - NAT Gateway: ~$32/month base + $0.045/GB data processed
   - Gateway VPC Endpoints (S3, DynamoDB): $0
   - Interface VPC Endpoints: ~$7.50/month + $0.01/GB
   - Data transfer: varies by usage

YOUR TASK:
Provide a nuanced analysis that:
1. Explains what this NAT Gateway might be used for
2. Identifies IF it can be optimized (not assumed)
3. Provides realistic cost scenarios
4. Includes multiple recommendation tiers based on usage patterns
5. Warns about risks of removal

Be specific about what information you DON'T have and what the developer should verify.

Respond in this exact JSON format:
${this.getResponseFormat()}`;
    }
    static getDynamoDBPrompt(context) {
        return `Analyze this DynamoDB table configuration:

\`\`\`terraform
${context.fullBlock}
\`\`\`

CONTEXT YOU MUST CONSIDER:
1. Billing modes:
   - PROVISIONED: Fixed capacity, ~$0.00065/hr per RCU, ~$0.00065/hr per WCU
   - PAY_PER_REQUEST: $1.25 per million reads, $1.25 per million writes
   
2. Break-even analysis:
   - PAY_PER_REQUEST is cheaper below ~7M requests/month
   - PROVISIONED is cheaper for consistent, high traffic
   
3. Current configuration indicates:
   ${context.configuration.read_capacity ? `- Provisioned ${context.configuration.read_capacity} RCUs` : '- Capacity not specified'}
   ${context.configuration.write_capacity ? `- Provisioned ${context.configuration.write_capacity} WCUs` : '- Capacity not specified'}

YOUR TASK:
1. Calculate realistic costs for BOTH modes
2. Identify break-even points
3. Recommend based on likely usage patterns
4. Provide production-ready Terraform with all required fields

Respond in this exact JSON format:
${this.getResponseFormat()}`;
    }
    static getLambdaPrompt(context) {
        const memorySize = context.configuration.memory_size || 'not specified';
        return `Analyze this Lambda function configuration:

\`\`\`terraform
${context.fullBlock}
\`\`\`

CONTEXT YOU MUST CONSIDER:
1. Lambda pricing:
   - Based on GB-seconds: memory allocation × execution time
   - 128MB = $0.0000000021/100ms
   - 1024MB = $0.0000166667/100ms (8x more expensive)
   
2. Memory affects:
   - Cost (linear with memory)
   - CPU allocation (proportional to memory)
   - Network bandwidth (higher memory = more bandwidth)
   
3. Current configuration:
   - Memory: ${memorySize}MB
   
4. Optimization considerations:
   - Some functions are CPU-bound (benefit from more memory = faster execution)
   - Some are I/O-bound (don't benefit from extra memory)
   - Need CloudWatch metrics to know for sure
   
YOUR TASK:
1. Provide realistic cost ranges for different memory settings
2. Explain trade-offs (cost vs performance)
3. Recommend starting point with monitoring strategy
4. DO NOT claim definitive savings without usage data

Respond in this exact JSON format:
${this.getResponseFormat()}`;
    }
    static getEC2Prompt(context) {
        const instanceType = context.configuration.instance_type || 'not specified';
        return `Analyze this EC2 instance configuration:

\`\`\`terraform
${context.fullBlock}
\`\`\`

CONTEXT YOU MUST CONSIDER:
1. Current configuration:
   - Instance type: ${instanceType}
   
2. Instance type considerations:
   - t3.micro: 2 vCPU, 1GB RAM, $7.30/month
   - t3.small: 2 vCPU, 2GB RAM, $14.60/month
   - t3.medium: 2 vCPU, 4GB RAM, $29.20/month
   - t3.large: 2 vCPU, 8GB RAM, $58.40/month
   
3. Use case matters:
   - Development/staging: smaller instances usually fine
   - Production: requires load testing to determine
   - Burstable (t3) vs compute-optimized (c6) vs memory (r6)
   
4. Risk of downsizing:
   - Performance degradation
   - OOM errors
   - CPU throttling on t3 instances
   
YOUR TASK:
1. Identify if this is likely over-provisioned
2. Provide safe downsizing recommendations
3. Explain monitoring requirements
4. Include rollback strategy

Respond in this exact JSON format:
${this.getResponseFormat()}`;
    }
    static getRDSPrompt(context) {
        return `Analyze this RDS configuration:

\`\`\`terraform
${context.fullBlock}
\`\`\`

CONTEXT YOU MUST CONSIDER:
1. RDS costs vary significantly by:
   - Instance type
   - Storage type (gp2 vs gp3 vs io1)
   - Multi-AZ deployment
   - Backup retention
   
2. Common optimizations:
   - RDS → Aurora Serverless v2 (70-90% savings for variable workloads)
   - db.t3 → db.t4g (20% savings, ARM-based)
   - gp2 → gp3 storage (20% savings)
   
3. Migration considerations:
   - Engine compatibility
   - Downtime requirements
   - Feature parity
   
YOUR TASK:
1. Provide realistic cost comparison
2. Identify safe migration paths
3. Explain risks and requirements
4. Include rollback procedures

Respond in this exact JSON format:
${this.getResponseFormat()}`;
    }
    static getGenericPrompt(context) {
        return `Analyze this AWS resource configuration:

\`\`\`terraform
${context.fullBlock}
\`\`\`

Provide a cost optimization analysis following the response format provided.
Focus on realistic, production-safe recommendations.`;
    }
    static getResponseFormat() {
        return `{
  "summary": {
    "currentCost": {
      "min": <number>,
      "max": <number>,
      "typical": <number>,
      "unit": "month",
      "assumptions": ["assumption 1", "assumption 2"]
    },
    "optimizedCost": {
      "min": <number>,
      "max": <number>,
      "typical": <number>,
      "unit": "month",
      "assumptions": ["assumption 1", "assumption 2"]
    },
    "savingsPotential": {
      "amount": "$X-Y/month",
      "percentage": <number>,
      "confidence": "high|medium|low"
    }
  },
  "analysis": {
    "currentArchitecture": "Brief description of what this resource does",
    "identifiedIssues": ["issue 1", "issue 2"],
    "optimizationOpportunities": ["opportunity 1", "opportunity 2"]
  },
  "recommendations": [
    {
      "approach": "Option 1: Brief name",
      "description": "Detailed explanation",
      "whenToUse": ["condition 1", "condition 2"],
      "whenNotToUse": ["condition 1", "condition 2"],
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1", "con 2"],
      "complexity": "simple|moderate|complex",
      "riskLevel": "low|medium|high",
      "terraform": {
        "code": "Complete, production-ready Terraform code",
        "requiredChanges": ["change 1", "change 2"],
        "validation": ["How to verify this works"]
      }
    }
  ],
  "importantNotes": [
    "Critical information the developer must know",
    "What information you don't have",
    "What they should verify before proceeding"
  ]
}`;
    }
}
exports.AIPromptEngine = AIPromptEngine;
//# sourceMappingURL=aiPromptEngine.js.map