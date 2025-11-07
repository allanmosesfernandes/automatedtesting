# Simple EC2 Deployment Guide

Quick guide to deploy the Automated Testing Dashboard on AWS EC2 for proof of concept.

## Prerequisites

- AWS Account
- EC2 instance access
- Basic terminal knowledge

## Step 1: Launch EC2 Instance

1. **Go to AWS EC2 Console**
2. **Click "Launch Instance"**
3. **Configure:**
   - Name: `playwright-testing-dashboard`
   - AMI: `Ubuntu Server 22.04 LTS`
   - Instance type: `t3.small` (2GB RAM minimum)
   - Key pair: Create or select existing
   - Storage: 30GB GP3

4. **Configure Security Group:**
   - Add inbound rule: `Custom TCP` - Port `3000` - Source: `0.0.0.0/0` (or your IP)
   - SSH rule should already be added

5. **Launch Instance**

## Step 2: Connect to Your Instance

```bash
# Get your instance public IP from AWS Console
# Replace with your key file and IP
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

## Step 3: Run Deployment Script

### Option A: From Local Machine (Recommended)

1. **Upload your code and deployment script:**
```bash
# From your local machine
scp -i "your-key.pem" -r C:\Users\AllanFernandes\Desktop\automated-testing ubuntu@your-ec2-ip:~/
```

2. **SSH into EC2 and run the script:**
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
cd automated-testing
chmod +x deploy-to-ec2.sh
./deploy-to-ec2.sh
```

### Option B: From Git Repository

1. **SSH into EC2:**
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

2. **Download and run the script:**
```bash
# Download the script
curl -o deploy-to-ec2.sh https://your-repo/deploy-to-ec2.sh
chmod +x deploy-to-ec2.sh

# Run it
./deploy-to-ec2.sh
# Choose option 2 (Clone from git) when prompted
# Enter your git repository URL
```

## Step 4: Access Your Dashboard

Once deployment completes, you'll see:

```
========================================
  ✅ DEPLOYMENT COMPLETE!
========================================

🌐 Dashboard URL: http://your-ec2-ip:3000
👤 Username: admin
🔑 Password: testadmin123
```

**Access it in your browser:**
- URL: `http://your-ec2-ip:3000`
- Login with the credentials shown

## Step 5: Update Security (Important!)

1. **Change the default password:**
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
cd automated-testing
nano .env
# Update AUTH_PASSWORD
sudo systemctl restart playwright-dashboard
```

2. **Restrict access to your IP:**
   - Go to EC2 Security Groups
   - Edit inbound rule for port 3000
   - Change source from `0.0.0.0/0` to `your-ip/32`

## Managing the Service

```bash
# Check status
sudo systemctl status playwright-dashboard

# View logs
sudo journalctl -u playwright-dashboard -f

# Restart service
sudo systemctl restart playwright-dashboard

# Stop service
sudo systemctl stop playwright-dashboard
```

## Troubleshooting

### Tests failing with "browser not found"

```bash
cd ~/automated-testing
npx playwright install chromium
npx playwright install-deps chromium
sudo systemctl restart playwright-dashboard
```

### Port 3000 not accessible

1. Check security group allows port 3000
2. Check service is running: `sudo systemctl status playwright-dashboard`
3. Check firewall: `sudo ufw status` (should be inactive by default)

### Service won't start

```bash
# Check logs
sudo journalctl -u playwright-dashboard -n 50

# Check if Node.js is installed
node --version

# Try running manually
cd ~/automated-testing
npm start
```

## Next Steps

### Add SSL/HTTPS (Optional)

If you want a proper domain with HTTPS:

1. **Point a domain to your EC2 IP**
2. **Install Caddy (easiest option):**

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

3. **Create Caddyfile:**

```bash
sudo nano /etc/caddy/Caddyfile
```

Add:
```
your-domain.com {
    reverse_proxy localhost:3000
}
```

4. **Restart Caddy:**
```bash
sudo systemctl restart caddy
```

Caddy will automatically get SSL certificates from Let's Encrypt!

### Cost Optimization

**t3.small pricing:** ~$15-17/month

To reduce costs:
- Use t3.micro ($7/month) for very light usage (may be slow)
- Stop instance when not in use (only pay for storage)
- Use EC2 savings plans for long-term usage

### Updating the Application

```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
cd ~/automated-testing
git pull origin main  # if using git
# or re-upload files with scp
sudo systemctl restart playwright-dashboard
```

## Quick Reference

| Task | Command |
|------|---------|
| Access dashboard | `http://your-ec2-ip:3000` |
| SSH to server | `ssh -i key.pem ubuntu@your-ec2-ip` |
| Check status | `sudo systemctl status playwright-dashboard` |
| View logs | `sudo journalctl -u playwright-dashboard -f` |
| Restart service | `sudo systemctl restart playwright-dashboard` |
| Edit config | `nano ~/automated-testing/.env` |

## Support

If you encounter issues:

1. Check service logs: `sudo journalctl -u playwright-dashboard -n 100`
2. Check Node.js logs in `/var/log/syslog`
3. Try running manually: `cd ~/automated-testing && npm start`
4. Ensure security group allows port 3000
5. Verify instance has at least 2GB RAM

---

**That's it!** You now have a running automated testing dashboard on EC2. 🚀
