# CodeGuard AI 🚀

**AI-Powered AWS Cost Optimization for Terraform (VS Code Extension)**

CodeGuard AI is a developer-first tool that helps engineers **prevent expensive AWS infrastructure mistakes while writing Terraform code**. It detects cost-inefficient configurations in real time and uses **AI (AWS Bedrock / Claude)** to suggest optimized cloud architecture and Terraform alternatives.

Instead of discovering cloud cost problems **after deployment**, CodeGuard AI stops them **during development**.

---

# 📌 Problem

Cloud infrastructure costs often grow unexpectedly because developers:

* Choose expensive default configurations
* Over-provision compute resources
* Use costly AWS services without realizing it
* Lack visibility into cost impact during development

Example mistakes commonly seen in Terraform:

* NAT Gateway used unnecessarily
* DynamoDB `PROVISIONED` capacity instead of on-demand
* Lambda functions allocated excessive memory
* Oversized EC2 instances used for development

These mistakes are usually detected **after deployment**, when the AWS bill arrives.

---

# 💡 Solution

CodeGuard AI integrates directly into **VS Code** and analyzes Terraform code while developers write infrastructure.

It provides:

### ⚡ Real-time cost detection

Instant warnings when expensive AWS configurations appear.

### 🤖 AI-powered architecture optimization

Developers can click **Analyze with AI** to receive:

* Estimated infrastructure cost
* Optimized architecture suggestions
* Terraform replacement code
* Pros and considerations
* Estimated savings

This allows developers to **fix infrastructure design before deployment**.

---

# 🎯 Key Features

## 1️⃣ Real-Time Cost Detection

CodeGuard automatically scans Terraform files and highlights cost-inefficient configurations.

Example:

```terraform
resource "aws_nat_gateway" "main" {
  allocation_id = "eipalloc-123"
  subnet_id     = "subnet-456"
}
```

VS Code instantly displays:

```
⚠ NAT Gateway costs ~$32/month
```

Diagnostics appear as:

* Editor squiggly underline
* Problems panel entry
* Inline tooltip warnings

---

## 2️⃣ AI-Powered Cost Optimization

Developers can click **Analyze with AI** above expensive resources.

CodeGuard sends the Terraform block to **AWS Bedrock (Claude)** for analysis.

Example output:

```
Current Cost: $32/month
Optimized Cost: $0/month
Annual Savings: $384/year
```

### Recommendation

Replace NAT Gateway with **VPC Endpoints** for S3 and DynamoDB access.

### Pros

* Zero monthly cost
* Lower latency
* More secure (no internet gateway required)
* Scales automatically

### Considerations

* No internet access
* Only works for supported AWS services
* Requires route table configuration

---

## 3️⃣ Optimized Terraform Suggestions

AI generates improved Terraform code.

Example:

```terraform
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.dynamodb"
}
```

Developers can copy optimized code directly from the AI panel.

---

# 🧠 AI Architecture

CodeGuard AI combines **rule-based detection** and **AI analysis**.

```
Terraform Code
      ↓
Local Static Rules (Instant)
      ↓
Cost Warnings in Editor
      ↓
Developer clicks "Analyze with AI"
      ↓
VS Code Extension
      ↓
AWS API Gateway
      ↓
AWS Lambda
      ↓
AWS Bedrock (Claude)
      ↓
AI Optimization Suggestions
```

This hybrid architecture provides:

* Instant feedback
* Deep AI reasoning
* Stable developer experience

---

# 🧰 Technologies Used

| Component               | Technology                 |
| ----------------------- | -------------------------- |
| Editor Extension        | VS Code Extension API      |
| Language                | TypeScript                 |
| Infrastructure Language | Terraform                  |
| AI Model                | Claude 3.5 via AWS Bedrock |
| Backend                 | AWS Lambda                 |
| API Layer               | AWS API Gateway            |
| Frontend Panel          | VS Code Webview            |

---

# 🔍 Current Cost Rules

CodeGuard currently detects the following cost risks:

| AWS Service | Issue                          |
| ----------- | ------------------------------ |
| NAT Gateway | ~$32/month fixed cost          |
| DynamoDB    | PROVISIONED capacity expensive |
| Lambda      | Excessive memory allocation    |
| EC2         | Oversized instance types       |

Additional rules planned for:

* RDS instance sizing
* S3 storage class usage
* Load balancers
* EBS volumes
* EKS node types

---

# 📸 Example Workflow

### Step 1 — Developer writes Terraform

```terraform
resource "aws_instance" "app" {
  instance_type = "t3.large"
}
```

### Step 2 — CodeGuard detects cost risk

```
💸 t3.large detected
Consider t3.micro or t3.small for dev/test
```

### Step 3 — Click "Analyze with AI"

CodeGuard opens an AI analysis panel.

### Step 4 — AI suggests improvements

* Smaller instance types
* Estimated cost savings
* Optimized Terraform code

---

# ⚙ Installation

1. Clone the repository

```
git clone https://github.com/your-repo/codeguard-ai.git
```

2. Install dependencies

```
npm install
```

3. Compile the extension

```
npm run compile
```

4. Run the extension

Press:

```
F5
```

This launches the **Extension Development Host**.

---

# 🚀 Usage

1. Open a Terraform file (`.tf`)
2. Write AWS infrastructure code
3. CodeGuard automatically detects expensive patterns
4. Click **Analyze with AI**
5. Review optimization suggestions
6. Apply improved Terraform configuration

---

# 📊 Example Cost Optimization

| Resource             | Current Cost | Optimized Cost  |
| -------------------- | ------------ | --------------- |
| NAT Gateway          | $32/month    | $0/month        |
| DynamoDB PROVISIONED | High         | PAY_PER_REQUEST |
| Lambda 1024MB        | Expensive    | 256MB           |
| EC2 t3.large         | $60/month    | t3.micro        |

---

# 🔐 Security Considerations

CodeGuard sends **only Terraform resource blocks** to the AI service.

Sensitive data such as:

* AWS credentials
* Secrets
* Access keys

are **never transmitted**.

---

# 🗺 Future Roadmap

Planned improvements:

* Full infrastructure cost estimation
* Architecture-level optimization
* More AWS service rules
* Auto-fix suggestions (Quick Fix)
* Multi-resource AI analysis
* CI/CD integration
* GitHub pull request analysis

---

# 🎥 Demo

Demo video will demonstrate:

1. Writing Terraform infrastructure
2. CodeGuard detecting cost risks
3. AI generating optimized architecture
4. Estimated savings displayed in real time

---

# 🏆 Hackathon Goal

CodeGuard AI aims to make **cloud cost optimization part of the development workflow**, helping teams prevent costly infrastructure mistakes before deployment.

---

# 🤝 Contributing

Contributions are welcome.

To contribute:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

# 📄 License

MIT License

---

# 👨‍💻 Author

Built to improve cloud infrastructure cost awareness and developer productivity.
