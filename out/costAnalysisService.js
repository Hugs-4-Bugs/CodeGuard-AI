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
        const resourceMatch = code.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        if (!resourceMatch) {
            throw new Error('Could not parse Terraform resource');
        }
        const [, resourceType, resourceName] = resourceMatch;
        const configuration = {};
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
                temperature: 0.3
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
        // Determine which analysis to return based on resource type and configuration
        const resourceType = context.resourceType;
        const config = context.configuration;
        // Check for specific patterns in the code
        const code = context.fullBlock.toLowerCase();
        // Route to appropriate mock based on detected issue
        if (resourceType === 'aws_nat_gateway') {
            return this.getNATGatewayAnalysis();
        }
        if (code.includes('billing_mode') && code.includes('provisioned')) {
            return this.getDynamoDBAnalysis();
        }
        if (code.includes('memory_size') && (code.includes('1024') || code.includes('1536') || code.includes('2048'))) {
            return this.getLambdaMemoryAnalysis();
        }
        if (code.includes('instance_type') && (code.includes('t3.large') || code.includes('t3.xlarge') || code.includes('m5.large'))) {
            return this.getEC2InstanceAnalysis();
        }
        if (code.includes('instance_class') && (code.includes('db.t3.large') || code.includes('db.m5.large') || code.includes('db.r5.large'))) {
            return this.getRDSInstanceAnalysis();
        }
        if (code.includes('type') && code.includes('gp2')) {
            return this.getEBSVolumeTypeAnalysis();
        }
        if (code.includes('size') && (code.includes('500') || code.includes('1000') || code.includes('2000'))) {
            return this.getEBSVolumeSizeAnalysis();
        }
        if (resourceType === 'aws_lb') {
            return this.getALBAnalysis();
        }
        if (resourceType === 'aws_eip' && !code.includes('instance')) {
            return this.getEIPAnalysis();
        }
        if (code.includes('retention_in_days') && code.includes('0')) {
            return this.getCloudWatchRetentionAnalysis();
        }
        if (code.includes('storage_class') && code.includes('standard')) {
            return this.getS3StorageClassAnalysis();
        }
        if (code.includes('allocated_storage') && (code.includes('500') || code.includes('1000'))) {
            return this.getRDSStorageAnalysis();
        }
        if (code.includes('multi_az') && code.includes('true')) {
            return this.getMultiAZAnalysis();
        }
        if (code.includes('monitoring') && code.includes('true')) {
            return this.getEC2MonitoringAnalysis();
        }
        return this.getGenericMockAnalysis();
    }
    // ============================================
    // ORIGINAL 4 ANALYSES
    // ============================================
    getNATGatewayAnalysis() {
        return {
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
}`,
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
                'Test in staging environment first'
            ]
        };
    }
    getDynamoDBAnalysis() {
        return {
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
  
  point_in_time_recovery {
    enabled = true
  }
  
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
                'Calculate break-even point: PAY_PER_REQUEST cheaper below ~7M requests/month'
            ]
        };
    }
    getLambdaMemoryAnalysis() {
        return {
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
  memory_size   = 512  # Balanced cost/performance
  timeout       = 30
  
  tracing_config {
    mode = "Active"
  }
  
  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
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
                'Test with production-like workloads in staging'
            ]
        };
    }
    getEC2InstanceAnalysis() {
        return {
            currentCost: '$60/month',
            optimizedCost: '$7/month',
            annualSavings: '$636/year',
            confidence: 'high',
            recommendation: 'Use t3.micro for development and testing. T3.large should only be used for proven production requirements.',
            whenToUse: [
                'Development or testing environment',
                'Low traffic applications',
                'Workloads with burstable CPU needs'
            ],
            whenNotToUse: [
                'Production workloads with consistent high CPU',
                'Memory-intensive applications',
                'Already right-sized based on metrics'
            ],
            alternativeTerraform: `resource "aws_instance" "app" {
  instance_type = "t3.micro"  # $7/month vs $60/month
  ami           = "ami-123"
  
  monitoring = false  # Save $2.10/month
  
  tags = {
    Environment = "dev"
  }
}`,
            pros: [
                '88% cost reduction',
                'Sufficient for dev/test workloads',
                'Can upgrade later if needed',
                'Burstable performance handles spikes'
            ],
            cons: [
                'Less CPU/memory for production workloads',
                'May need resizing based on metrics',
                'CPU credits can be exhausted'
            ],
            importantNotes: [
                'Monitor CPU credit balance and utilization',
                'Upgrade to t3.small or t3.medium if consistently high CPU'
            ]
        };
    }
    // ============================================
    // NEW 10 ANALYSES
    // ============================================
    getRDSInstanceAnalysis() {
        return {
            currentCost: '$120/month',
            optimizedCost: '$15-30/month',
            annualSavings: '$1,080-1,260/year',
            confidence: 'high',
            recommendation: 'For dev/test environments, use db.t4g.micro or db.t4g.small. For production, consider Aurora Serverless v2 for automatic scaling.',
            whenToUse: [
                'Development or testing database',
                'Low query volume',
                'Variable workload patterns'
            ],
            whenNotToUse: [
                'Production databases with consistent load',
                'High-performance requirements',
                'Large dataset requiring significant memory'
            ],
            alternativeTerraform: `resource "aws_db_instance" "db" {
  instance_class = "db.t4g.micro"  # $15/month
  engine         = "postgres"
  
  # Or consider Aurora Serverless v2
  # auto-scales from 0.5 to 1 ACU
  # ~$43/month for low usage
}`,
            pros: [
                '87% cost reduction for dev/test',
                'ARM-based t4g instances 20% cheaper than t3',
                'Sufficient for most development workloads'
            ],
            cons: [
                'Lower CPU and memory',
                'May not handle production load',
                'Requires testing before migration'
            ],
            importantNotes: [
                'For production, test Aurora Serverless v2',
                'Monitor CPU and memory metrics before downsizing'
            ]
        };
    }
    getEBSVolumeTypeAnalysis() {
        return {
            currentCost: '$10/month per 100GB',
            optimizedCost: '$8/month per 100GB',
            annualSavings: '$24/year per 100GB',
            confidence: 'high',
            recommendation: 'Switch from gp2 to gp3 volumes. GP3 provides same baseline performance (3000 IOPS, 125 MB/s) at 20% lower cost.',
            whenToUse: [
                'All new EBS volumes',
                'Existing gp2 volumes (easy migration)',
                'Any workload using general purpose SSD'
            ],
            whenNotToUse: [
                'Never - gp3 is always better or equal to gp2'
            ],
            alternativeTerraform: `resource "aws_ebs_volume" "data" {
  availability_zone = "us-east-1a"
  size              = 100
  type              = "gp3"  # 20% cheaper than gp2
  
  # Optional: Customize IOPS/throughput beyond baseline
  iops       = 3000
  throughput = 125
}`,
            pros: [
                '20% cost reduction with same performance',
                'Can customize IOPS/throughput independently',
                'No downside - strictly better than gp2'
            ],
            cons: [
                'None - this is a no-brainer optimization'
            ],
            importantNotes: [
                'AWS recommends gp3 for all new volumes',
                'Can migrate existing gp2 → gp3 with zero downtime'
            ]
        };
    }
    getEBSVolumeSizeAnalysis() {
        return {
            currentCost: '$100-500/month',
            optimizedCost: '$10-50/month',
            annualSavings: '$1,080-5,400/year',
            confidence: 'medium',
            recommendation: 'Large EBS volumes often indicate over-provisioning. Start with 50-100GB and enable autoscaling or use lifecycle policies to manage growth.',
            whenToUse: [
                'Actually need large storage capacity',
                'Proven usage patterns justify size',
                'High I/O requirements'
            ],
            whenNotToUse: [
                'Just starting a project (unknown needs)',
                'Can use S3 for bulk storage instead',
                'Provisioned "just in case"'
            ],
            alternativeTerraform: `resource "aws_ebs_volume" "data" {
  size = 100  # Start smaller
  type = "gp3"
  
  # Monitor and expand as needed
  # Or use S3 for cold data
}

# Consider S3 for archival data
resource "aws_s3_bucket" "archive" {
  bucket = "data-archive"
  
  lifecycle_rule {
    enabled = true
    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}`,
            pros: [
                'Pay only for storage actually needed',
                'Can expand volumes dynamically',
                'S3 much cheaper for archival data ($0.023/GB vs $0.08/GB)'
            ],
            cons: [
                'Need to monitor usage and expand if needed',
                'Moving to S3 requires application changes'
            ],
            importantNotes: [
                'Review actual disk usage before provisioning',
                'Use CloudWatch metrics to track volume utilization',
                'Consider S3 for infrequently accessed data'
            ]
        };
    }
    getALBAnalysis() {
        return {
            currentCost: '$22/month',
            optimizedCost: '$3.50 per million requests',
            annualSavings: '$200+/year',
            confidence: 'medium',
            recommendation: 'For REST APIs, consider API Gateway instead of ALB. API Gateway is serverless, cheaper at low traffic, and provides built-in features like rate limiting and caching.',
            whenToUse: [
                'Simple REST API',
                'Low to medium traffic (<1M requests/month)',
                'Need API Gateway features (rate limiting, caching)'
            ],
            whenNotToUse: [
                'WebSocket connections',
                'Very high traffic (>10M requests/month)',
                'Need Layer 7 routing for multiple targets',
                'Running containers/EC2 instances'
            ],
            alternativeTerraform: `resource "aws_apigatewayv2_api" "api" {
  name          = "api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api.invoke_arn
}

# Cost: $3.50 per million requests
# vs ALB: $22/month + $0.008 per LCU-hour`,
            pros: [
                'No fixed monthly cost (pay per request)',
                'Built-in features (throttling, caching, auth)',
                'Serverless - no infrastructure to manage',
                'Cheaper for low/medium traffic'
            ],
            cons: [
                'Not suitable for WebSockets (use ALB)',
                'Can be more expensive at very high traffic',
                '29-second timeout limit'
            ],
            importantNotes: [
                'Calculate break-even: ~6M requests/month',
                'API Gateway better for serverless architectures'
            ]
        };
    }
    getEIPAnalysis() {
        return {
            currentCost: '$3.60/month',
            optimizedCost: '$0/month',
            annualSavings: '$43/year',
            confidence: 'high',
            recommendation: 'Unattached Elastic IPs cost $3.60/month. Either attach it to a running instance or release it if not needed.',
            whenToUse: [
                'Need static IP for running instance',
                'Required for whitelisting'
            ],
            whenNotToUse: [
                'IP is not attached to any instance',
                'Can use dynamic IPs instead',
                'Using load balancer (doesn\'t need EIP)'
            ],
            alternativeTerraform: `# Option 1: Attach to instance (free when attached)
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  vpc      = true
}

# Option 2: Use load balancer DNS instead
# (No EIP needed - ALB provides DNS name)`,
            pros: [
                'Free when attached to running instance',
                'Static IP for external access'
            ],
            cons: [
                'Costs $3.60/month when unattached',
                'Limited to 5 EIPs per region by default'
            ],
            importantNotes: [
                '⚠️ Unattached EIPs waste money',
                'Release unused EIPs immediately',
                'Consider using DNS names instead of static IPs'
            ]
        };
    }
    getCloudWatchRetentionAnalysis() {
        return {
            currentCost: '$0.50/GB/month',
            optimizedCost: '$0.03/GB/month',
            annualSavings: '$60-600/year',
            confidence: 'high',
            recommendation: 'Set CloudWatch Logs retention to 7-30 days instead of infinite. Logs older than 30 days are rarely accessed and expensive to store.',
            whenToUse: [
                'Development or testing logs',
                'High-volume applications',
                'Logs used only for recent debugging'
            ],
            whenNotToUse: [
                'Compliance requires long retention',
                'Audit logs for security',
                'Already exporting to S3 for archival'
            ],
            alternativeTerraform: `resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/lambda/app"
  retention_in_days = 7  # or 14, 30 days
  
  # Much cheaper than infinite retention
}

# For long-term storage, export to S3
resource "aws_cloudwatch_log_subscription_filter" "export" {
  name            = "export-to-s3"
  log_group_name  = aws_cloudwatch_log_group.app.name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.logs.arn
}`,
            pros: [
                '94% cost reduction (7 days vs infinite)',
                'Still have recent logs for debugging',
                'Can export old logs to S3 if needed'
            ],
            cons: [
                'Old logs are deleted',
                'Need export strategy for compliance'
            ],
            importantNotes: [
                'CloudWatch Logs: $0.50/GB/month',
                'S3 storage: $0.023/GB/month (95% cheaper)',
                'Set retention based on actual debugging needs'
            ]
        };
    }
    getS3StorageClassAnalysis() {
        return {
            currentCost: '$23/TB/month',
            optimizedCost: '$4-13/TB/month',
            annualSavings: '$120-228/TB/year',
            confidence: 'medium',
            recommendation: 'Use S3 Intelligent-Tiering or lifecycle policies to move infrequently accessed data to cheaper storage classes.',
            whenToUse: [
                'Data accessed less than once per month',
                'Archival data',
                'Backup storage'
            ],
            whenNotToUse: [
                'Frequently accessed data (daily/weekly)',
                'Small files with high retrieval costs',
                'Data accessed unpredictably'
            ],
            alternativeTerraform: `resource "aws_s3_bucket_lifecycle_configuration" "archive" {
  bucket = aws_s3_bucket.data.id

  rule {
    id     = "archive-old-data"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"  # 45% cheaper
    }

    transition {
      days          = 90
      storage_class = "GLACIER"  # 80% cheaper
    }
  }
}`,
            pros: [
                '45% savings with STANDARD_IA',
                '80% savings with GLACIER',
                'Automatic with lifecycle policies',
                'No application changes needed'
            ],
            cons: [
                'Retrieval fees for IA and GLACIER',
                'Minimum storage duration charges',
                'GLACIER retrieval takes hours'
            ],
            importantNotes: [
                'S3 STANDARD: $0.023/GB',
                'S3 STANDARD_IA: $0.0125/GB (45% cheaper)',
                'S3 GLACIER: $0.004/GB (80% cheaper)'
            ]
        };
    }
    getRDSStorageAnalysis() {
        return {
            currentCost: '$50-200/month',
            optimizedCost: '$10-50/month',
            annualSavings: '$480-1,800/year',
            confidence: 'medium',
            recommendation: 'Start with smaller storage and enable autoscaling. RDS can automatically expand storage as needed, avoiding over-provisioning.',
            whenToUse: [
                'Uncertain about future storage needs',
                'New database',
                'Variable data growth'
            ],
            whenNotToUse: [
                'Proven storage requirements',
                'Predictable growth pattern',
                'Already optimized'
            ],
            alternativeTerraform: `resource "aws_db_instance" "db" {
  allocated_storage     = 100  # Start smaller
  max_allocated_storage = 1000 # Autoscale up to 1TB
  
  storage_type = "gp3"  # 20% cheaper than gp2
  
  # Storage autoscaling enabled
}`,
            pros: [
                'Pay only for storage actually used',
                'Automatic scaling prevents outages',
                'No manual intervention needed'
            ],
            cons: [
                'Scaling events cause brief I/O performance impact',
                'Need to monitor to avoid runaway growth'
            ],
            importantNotes: [
                'Enable storage autoscaling',
                'Set max_allocated_storage to prevent runaway costs',
                'Monitor storage growth trends'
            ]
        };
    }
    getMultiAZAnalysis() {
        return {
            currentCost: '$240/month',
            optimizedCost: '$120/month',
            annualSavings: '$1,440/year',
            confidence: 'high',
            recommendation: 'Multi-AZ deployment doubles RDS costs. Only use for production databases that require high availability. Use single-AZ for dev/test environments.',
            whenToUse: [
                'Production databases',
                'Business-critical applications',
                'Require automatic failover'
            ],
            whenNotToUse: [
                'Development environments',
                'Testing databases',
                'Non-critical applications',
                'Can tolerate downtime'
            ],
            alternativeTerraform: `resource "aws_db_instance" "dev_db" {
  instance_class = "db.t4g.small"
  multi_az       = false  # Single-AZ for dev/test
  
  # Save snapshots for recovery instead
  backup_retention_period = 7
  
  tags = {
    Environment = "development"
  }
}`,
            pros: [
                '50% cost reduction',
                'Still have backups for recovery',
                'Sufficient for non-production'
            ],
            cons: [
                'No automatic failover',
                'Manual recovery from backups (minutes of downtime)',
                'Single point of failure'
            ],
            importantNotes: [
                '⚠️ Multi-AZ = 2x cost',
                'Use single-AZ for dev/test',
                'Enable Multi-AZ only for production'
            ]
        };
    }
    getEC2MonitoringAnalysis() {
        return {
            currentCost: '$2.10/instance/month',
            optimizedCost: '$0/month',
            annualSavings: '$25/instance/year',
            confidence: 'high',
            recommendation: 'EC2 detailed monitoring provides 1-minute metrics but costs $2.10/month per instance. Basic monitoring (5-minute metrics) is free and sufficient for most use cases.',
            whenToUse: [
                'Need 1-minute granularity for autoscaling',
                'Production instances with strict SLAs',
                'High-traffic applications'
            ],
            whenNotToUse: [
                'Development/test instances',
                '5-minute metrics are sufficient',
                'Using CloudWatch agent for custom metrics anyway'
            ],
            alternativeTerraform: `resource "aws_instance" "app" {
  instance_type = "t3.micro"
  monitoring    = false  # Use basic monitoring (free)
  
  # Basic monitoring provides:
  # - 5-minute interval metrics
  # - All standard CloudWatch metrics
  # - Free tier eligible
}`,
            pros: [
                'Save $2.10/instance/month',
                'Basic monitoring covers most needs',
                '5-minute granularity often sufficient'
            ],
            cons: [
                'No 1-minute metrics',
                'Slower to detect issues',
                'May impact autoscaling responsiveness'
            ],
            importantNotes: [
                'Basic monitoring is free and usually enough',
                'Enable detailed monitoring only for production critical instances'
            ]
        };
    }
    getGenericMockAnalysis() {
        return {
            currentCost: 'Unknown',
            optimizedCost: 'Requires analysis',
            annualSavings: 'To be determined',
            confidence: 'low',
            recommendation: 'Enable AI analysis backend for detailed recommendations specific to this resource type.',
            pros: ['Comprehensive cost analysis available'],
            cons: ['Requires AWS Bedrock integration'],
            importantNotes: ['Connect to AWS Bedrock for production-grade analysis']
        };
    }
}
exports.CostAnalysisService = CostAnalysisService;
//# sourceMappingURL=costAnalysisService.js.map