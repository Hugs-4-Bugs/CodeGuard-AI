"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostAnalysisService = void 0;
const aiPromptEngine_1 = require("./aiPromptEngine");
class CostAnalysisService {
    apiEndpoint = process.env.CODEGUARD_API_ENDPOINT || '';
    async analyze(terraformCode) {
        const context = this.parseTerraformBlock(terraformCode);
        if (this.apiEndpoint) {
            return await this.callBedrockAPI(context);
        }
        else {
            return this.getEnhancedMockAnalysis(context);
        }
    }
    parseTerraformBlock(code) {
        // Extract resource type and name
        const resourceMatch = code.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        if (!resourceMatch) {
            throw new Error('Could not parse Terraform resource');
        }
        const [, resourceType, resourceName] = resourceMatch;
        // Simple configuration extraction (you can enhance this)
        const configuration = {};
        // Extract key = value pairs
        const configMatches = code.matchAll(/(\w+)\s*=\s*(.+)/g);
        for (const match of configMatches) {
            const [, key, value] = match;
            configuration[key] = value.replace(/["\s]/g, '');
        }
        return {
            resourceType,
            resourceName,
            configuration,
            fullBlock: code
        };
    }
    async callBedrockAPI(context) {
        const request = {
            context,
            analysisType: 'cost_optimization'
        };
        const prompt = aiPromptEngine_1.AIPromptEngine.generatePrompt(request);
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: JSON.parse(prompt).prompt,
                system: JSON.parse(prompt).system,
                max_tokens: 2000,
                temperature: 0.3 // Lower temperature for more consistent, factual responses
            })
        });
        if (!response.ok) {
            throw new Error(`Bedrock API error: ${response.status}`);
        }
        const aiResponse = await response.json();
        return this.convertAIResponseToUI(aiResponse);
    }
    convertAIResponseToUI(aiResponse) {
        const primaryRecommendation = aiResponse.recommendations[0];
        const currentCostRange = aiResponse.summary.currentCost;
        const optimizedCostRange = aiResponse.summary.optimizedCost;
        return {
            currentCost: currentCostRange.min === currentCostRange.max
                ? `$${currentCostRange.typical}/${currentCostRange.unit}`
                : `$${currentCostRange.min}-${currentCostRange.max}/${currentCostRange.unit}`,
            optimizedCost: optimizedCostRange.min === optimizedCostRange.max
                ? `$${optimizedCostRange.typical}/${optimizedCostRange.unit}`
                : `$${optimizedCostRange.min}-${optimizedCostRange.max}/${optimizedCostRange.unit}`,
            annualSavings: aiResponse.summary.savingsPotential.amount,
            recommendation: primaryRecommendation.description,
            alternativeTerraform: primaryRecommendation.terraform.code,
            pros: primaryRecommendation.pros,
            cons: primaryRecommendation.cons,
            confidence: aiResponse.summary.savingsPotential.confidence,
            risks: primaryRecommendation.whenNotToUse,
            whenToUse: primaryRecommendation.whenToUse,
            whenNotToUse: primaryRecommendation.whenNotToUse,
            importantNotes: aiResponse.importantNotes
        };
    }
    getEnhancedMockAnalysis(context) {
        // Enhanced mock responses with realistic nuance
        const mocks = {
            'aws_nat_gateway': {
                currentCost: '$32-45/month',
                optimizedCost: '$0-15/month',
                annualSavings: '$200-540/year',
                confidence: 'medium',
                recommendation: 'The optimization depends on your NAT Gateway usage pattern. If used primarily for S3/DynamoDB access, Gateway VPC Endpoints can eliminate this cost entirely. If used for outbound internet access, you may need a hybrid approach.',
                whenToUse: [
                    'Traffic is primarily to S3 and DynamoDB',
                    'No outbound internet access required',
                    'All dependencies are within AWS'
                ],
                whenNotToUse: [
                    'Applications download packages from internet',
                    'Need to call external APIs',
                    'Pulling Docker images from public registries',
                    'Accessing third-party services'
                ],
                alternativeTerraform: `# Option 1: Gateway VPC Endpoints (Free for S3/DynamoDB)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.\${var.region}.s3"
  
  route_table_ids = [
    aws_route_table.private.id
  ]
  
  tags = {
    Name = "s3-vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.\${var.region}.dynamodb"
  
  route_table_ids = [
    aws_route_table.private.id
  ]
  
  tags = {
    Name = "dynamodb-vpc-endpoint"
  }
}

# Option 2: Hybrid Approach (if internet access needed)
# Keep NAT Gateway but add VPC Endpoints to reduce traffic/cost`,
                pros: [
                    'Gateway VPC Endpoints for S3/DynamoDB are completely free',
                    'Lower latency (stays within AWS network)',
                    'More secure (no internet gateway traversal)',
                    'Unlimited bandwidth at no cost'
                ],
                cons: [
                    'Only works for S3 and DynamoDB (not other services)',
                    'Does NOT provide outbound internet access',
                    'Requires route table configuration',
                    'May need to keep NAT Gateway for other traffic'
                ],
                importantNotes: [
                    '⚠️ IMPORTANT: Verify your NAT Gateway usage before removing it',
                    'Check VPC Flow Logs to see what traffic goes through NAT Gateway',
                    'Test in staging environment first',
                    'Keep NAT Gateway if you need ANY internet access from private subnets'
                ]
            },
            'aws_dynamodb_table': {
                currentCost: '$23-47/month',
                optimizedCost: '$4-12/month',
                annualSavings: '$228-420/year',
                confidence: 'medium',
                recommendation: 'Switch to PAY_PER_REQUEST if traffic is variable or unpredictable. PROVISIONED is only cost-effective above ~7 million requests/month with consistent traffic patterns.',
                whenToUse: [
                    'Traffic is variable or unpredictable',
                    'Application is in early stages',
                    'Usage spikes are common',
                    'Below 7M requests/month'
                ],
                whenNotToUse: [
                    'Consistent high traffic (>7M requests/month)',
                    'Predictable usage patterns',
                    'Already optimized provisioned capacity'
                ],
                alternativeTerraform: `resource "aws_dynamodb_table" "users" {
  name         = "users"
  billing_mode = "PAY_PER_REQUEST"
  
  hash_key = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }
  
  # Add server-side encryption
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}`,
                pros: [
                    '70-90% cost reduction for variable workloads',
                    'No capacity planning required',
                    'Automatic scaling to zero when idle',
                    'Pay only for actual usage'
                ],
                cons: [
                    'More expensive at very high consistent volumes',
                    'Cannot reserve capacity for discounts',
                    'May have cold start latency if table idle for hours'
                ],
                importantNotes: [
                    'Monitor actual request patterns with CloudWatch',
                    'Calculate break-even point: PAY_PER_REQUEST cheaper below ~7M requests/month',
                    'Can switch back to PROVISIONED if traffic becomes predictable'
                ]
            },
            'aws_lambda_function': {
                currentCost: '$8-15/month',
                optimizedCost: '$2-5/month',
                annualSavings: '$72-120/year',
                confidence: 'low',
                recommendation: 'Start with 256-512MB memory and adjust based on CloudWatch metrics. The optimal setting depends on whether your function is CPU-bound or I/O-bound, which requires monitoring to determine.',
                whenToUse: [
                    'Function is primarily I/O-bound (waiting on APIs, databases)',
                    'Current metrics show low memory utilization',
                    'Execution time doesn\'t decrease with more memory'
                ],
                whenNotToUse: [
                    'Function is CPU-intensive (data processing, encryption)',
                    'CloudWatch shows memory pressure',
                    'Faster execution justifies higher memory cost'
                ],
                alternativeTerraform: `resource "aws_lambda_function" "api" {
  function_name = "api"
  
  # Start with 512MB - good balance of cost and performance
  memory_size = 512
  timeout     = 30
  
  # Enable Lambda Insights for detailed monitoring
  layers = [
    "arn:aws:lambda:\${var.region}:580247275435:layer:LambdaInsightsExtension:21"
  ]
  
  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }
  
  # Enable X-Ray for performance tracing
  tracing_config {
    mode = "Active"
  }
}

# Add CloudWatch alarm to monitor memory usage
resource "aws_cloudwatch_metric_alarm" "lambda_memory" {
  alarm_name          = "\${aws_lambda_function.api.function_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  
  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}`,
                pros: [
                    '50-75% cost reduction if function is I/O-bound',
                    'Faster cold starts with less memory allocation',
                    'Lower cost per invocation'
                ],
                cons: [
                    'May increase execution time (and cost) if CPU-bound',
                    'Could cause timeouts if insufficient resources',
                    'Requires monitoring to optimize correctly'
                ],
                importantNotes: [
                    '⚠️ DO NOT blindly reduce memory without testing',
                    'Monitor CloudWatch metrics: Duration, Memory Used, Billed Duration',
                    'Test with production-like workloads in staging',
                    'Some functions actually save money with MORE memory (faster execution)'
                ]
            }
        };
        return mocks[context.resourceType] || this.getGenericMockAnalysis();
    }
    getGenericMockAnalysis() {
        return {
            currentCost: 'Unknown',
            optimizedCost: 'Requires analysis',
            annualSavings: 'To be determined',
            recommendation: 'Enable AI analysis backend for detailed recommendations.',
            pros: [],
            cons: [],
            importantNotes: ['Connect to AWS Bedrock for production-grade analysis']
        };
    }
}
exports.CostAnalysisService = CostAnalysisService;
//# sourceMappingURL=costAnalysisService.js.map