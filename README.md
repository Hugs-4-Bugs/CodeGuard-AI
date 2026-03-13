# CodeGuard AI 🚀

**AI-Powered AWS Cost Optimization for Terraform (VS Code Extension)**

CodeGuard AI is a developer-first tool that helps engineers **prevent expensive AWS infrastructure mistakes while writing Terraform code**.
It detects cost-inefficient configurations in real time and uses **AI (Amazon Bedrock + Claude)** to recommend optimized cloud architecture and Terraform alternatives.

Instead of discovering cloud cost problems **after deployment**, CodeGuard AI stops them **during development**.

---

# 📌 The Problem

Cloud infrastructure costs often grow unexpectedly because developers:

* Choose expensive default configurations
* Over-provision compute resources
* Use costly AWS services unintentionally
* Lack visibility into cost impact during development

Typical Terraform mistakes include:

* Using **NAT Gateway unnecessarily**
* Choosing **DynamoDB PROVISIONED capacity**
* Allocating **excessive Lambda memory**
* Selecting **oversized EC2 / RDS instances**
* Creating **large unused EBS volumes**

These problems are usually discovered **after deployment**, when the AWS bill arrives.

---

# 💡 The Solution

CodeGuard AI integrates directly into **VS Code** and analyzes Terraform infrastructure **as developers write code**.

It provides:

### ⚡ Real-time cost detection

Instant warnings for expensive AWS resources.

### 🤖 AI-powered architecture optimization

With **AWS Bedrock (Claude)**, developers receive:

* Cost estimates
* Optimized infrastructure suggestions
* Terraform replacement code
* Pros and considerations
* Estimated savings

Developers can **fix infrastructure design before deployment**.

---

# ✨ Key Features

## 1️⃣ Real-Time Cost Detection

CodeGuard scans Terraform files and highlights cost risks instantly.

Example Terraform:

```terraform
resource "aws_nat_gateway" "main" {
  allocation_id = "eipalloc-123"
  subnet_id     = "subnet-456"
}
```

VS Code warning:

```
⚠ NAT Gateway costs ~$32/month
```

Diagnostics appear as:

* Editor squiggly underline
* Problems panel entry
* Inline tooltip warnings

---

## 2️⃣ AI-Powered Optimization

Developers click **“Analyze with AI”** to run deeper analysis.

CodeGuard sends the Terraform resource to **Amazon Bedrock (Claude)**.

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
* More secure networking
* Automatic scaling

### Considerations

* Does not provide internet access
* Only works for supported AWS services
* Requires route table configuration

---

## 3️⃣ Quick Fix Suggestions

CodeGuard integrates with **VS Code CodeActions**.

Examples:

```
Fix → Replace PROVISIONED with PAY_PER_REQUEST
Fix → Reduce Lambda memory
Fix → Suggest smaller instance type
Fix → Replace NAT Gateway with VPC endpoint
```

Developers can apply fixes **directly in the editor**.

---

## 4️⃣ Optimized Terraform Code

AI generates improved Terraform infrastructure.

Example:

```terraform
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.dynamodb"
  vpc_endpoint_type = "Gateway"
}
```

Developers can **copy optimized infrastructure directly into their project**.

---

# 🧠 System Architecture

CodeGuard AI uses a **hybrid architecture** combining:

* Fast local analysis
* AI-driven optimization

---

## High Level Flow

```
Terraform Code
      ↓
VS Code Extension
      ↓
Rule-Based Cost Detection
      ↓
Warnings in Editor
      ↓
User clicks "Analyze with AI"
      ↓
AWS Lambda API
      ↓
Amazon Bedrock (Claude)
      ↓
Optimization Suggestions
      ↓
Displayed in VS Code Panel
```

---

# 🧱 Extension Architecture

```
┌─────────────────────────────────────────────┐
│               VS Code Extension             │
│               (TypeScript)                  │
├─────────────────────────────────────────────┤
│                                             │
│  Layer 1: FAST LOCAL ANALYSIS               │
│  ┌───────────────────────────────────────┐  │
│  │ • Regex-based rule engine             │  │
│  │ • Instant diagnostics (squigglies)    │  │
│  │ • Problems panel integration          │  │
│  │ • CodeLens "Analyze with AI" buttons  │  │
│  └───────────────────────────────────────┘  │
│              ↓                               │
│  Layer 2: AI ANALYSIS                        │
│  ┌───────────────────────────────────────┐  │
│  │ • Extract Terraform resource context  │  │
│  │ • Call AWS Lambda API                 │  │
│  │ • Show loading indicator              │  │
│  │ • Cache analysis results              │  │
│  └───────────────────────────────────────┘  │
│              ↓                               │
│  Layer 3: QUICK FIXES                        │
│  ┌───────────────────────────────────────┐  │
│  │ • Replace PROVISIONED → PAY_PER_REQUEST│ │
│  │ • Reduce Lambda memory                │  │
│  │ • Suggest smaller instance type       │  │
│  │ • Generate alternative Terraform code │  │
│  └───────────────────────────────────────┘  │
│              ↓                               │
│  Layer 4: RESULTS DISPLAY                    │
│  ┌───────────────────────────────────────┐  │
│  │ • Webview panel UI                    │  │
│  │ • Cost comparison chart               │  │
│  │ • Copy optimized code                 │  │
│  │ • Export savings report               │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

# ☁️ AWS Infrastructure

```
┌───────────────────────────────┐
│         VS Code Extension      │
│  Local rule-based detection    │
└─────────────┬─────────────────┘
              │
              ▼
       User clicks
    "Analyze with AI"
              │
              ▼
┌───────────────────────────────┐
│        AWS API Gateway         │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│          AWS Lambda            │
│                                │
│ • Parse Terraform resource     │
│ • Extract configuration        │
│ • Estimate current cost        │
│ • Build Bedrock prompt         │
│ • Request optimization         │
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│        Amazon Bedrock          │
│         Claude 3.5             │
│                                │
│ AI analyzes architecture and   │
│ recommends cheaper alternatives│
└─────────────┬─────────────────┘
              │
              ▼
      Optimization Results
              │
              ▼
   Returned to VS Code panel
```

Optional services:

* DynamoDB → caching AI responses
* CloudWatch → logs & monitoring

---

# 🔍 Current Cost Detection Rules

CodeGuard currently detects:

| AWS Service | Cost Issue                     |
| ----------- | ------------------------------ |
| NAT Gateway | ~$32/month baseline cost       |
| DynamoDB    | PROVISIONED capacity expensive |
| Lambda      | Excessive memory allocation    |
| EC2         | Oversized instance types       |
| RDS         | Large database instances       |
| EBS         | Oversized volumes              |
| Elastic IP  | Unattached IP cost             |
| CloudWatch  | Log retention misconfiguration |
| S3          | Storage class inefficiencies   |

---

# 📊 Example Optimization

| Resource             | Current Cost | Optimized Cost  |
| -------------------- | ------------ | --------------- |
| NAT Gateway          | $32/month    | $0/month        |
| DynamoDB PROVISIONED | High         | PAY_PER_REQUEST |
| Lambda 1024MB        | Expensive    | 256MB           |
| EC2 t3.large         | $60/month    | t3.micro        |

---

# ⚙ Installation

Clone repository:

```
git clone https://github.com/Hugs-4-Bugs/CodeGuard-AI.git
```

Install dependencies:

```
npm install
```

Compile extension:

```
npm run compile
```

Run extension:

Press:

```
F5
```

This launches the **VS Code Extension Development Host**.

---

# 🚀 Usage

1. Open a Terraform file
2. Write AWS infrastructure code
3. CodeGuard detects expensive configurations
4. Click **Analyze with AI**
5. Review optimized architecture
6. Apply improved Terraform configuration

---

# 🎥 Demo

Full demo video:

https://www.youtube.com/

*(Replace with your demo link)*

---

# 🔐 Security

CodeGuard only sends **Terraform resource blocks** to the AI backend.

Sensitive information such as:

* AWS credentials
* API keys
* Secrets

is **never transmitted**.

---

# 🗺 Future Roadmap

Planned improvements:

* Full infrastructure cost estimation
* Multi-resource architecture analysis
* More AWS service rules
* CI/CD integration
* GitHub pull request analysis
* Kubernetes / Pulumi support

---

# 🤝 Contributing

Contributions welcome.

Steps:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

# 📄 License

MIT License

---

# 👨‍💻 Author

Built to help developers **prevent expensive cloud mistakes before deployment**.
