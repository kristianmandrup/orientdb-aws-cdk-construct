# OrientDB on Fargate via AWS CDK

Install OrientDB on AWS Fargate via AWS CDK (Cloud Development Kit)

1. ## 🧰 Prerequisites

   - 🛠 AWS CLI Installed & Configured - [Get help here](https://youtu.be/TPyyfmQte0U)
   - 🛠 AWS CDK Installed & Configured - [Get help here](https://www.youtube.com/watch?v=MKwxpszw0Rc)
   - 🛠 Python Packages, _Change the below commands to suit your operating system, the following are written for \_Amazon Linux 2_
     - Python3 - `yum install -y python3`
     - Python Pip - `yum install -y python-pip`
     - Virtualenv - `pip3 install virtualenv`

1. ## ⚙️ Setting up the environment

   ```bash
   git clone https://github.com/kristianmandrup/orientdb-aws-cdk-construct
   cd orientdb-aws-cdk-construct
   ```

1. ## 🚀 Deployment using AWS CDK

First set OS environment variables AWS_ACCOUNT and AWS_REGION to match your AWS account.

```bash
export AWS_ACCOUNT="835800058584"
export AWS_REGION="us-east-1"
```

Now install aws-cdk tooling, python tooling etc.

```bash
# If you DONT have cdk installed
npm install -g aws-cdk
# If this is first time you are using cdk then, run cdk bootstrap
# cdk bootstrap


# Make sure you in root directory
python3 -m venv .env
source .env/bin/activate
# Install any dependencies
pip install -r requirements.txt
```

Finally run the cdk synthesize and then deploy to the AWS account

```bash
# Synthesize the template and deploy it
cdk synth
cdk deploy
```

1. ## 🧹 CleanUp

   If you want to destroy all the resources created by the stack, Execute the below command to delete the stack, or _you can delete the stack from console as well_

   ```bash
   cdk destroy *
   ```

   This is not an exhaustive list, please carry out other necessary steps as maybe applicable to your needs.

### 💡 Help/Suggestions or 🐛 Bugs

Thank you for your interest in contributing to this project. Whether it is a bug report, new feature, correction, or additional documentation or solutions, we greatly value feedback and contributions from our community.
