# 🚀 OnusOne P2P Backend Cloud Deployment Guide

## **Overview**
This guide will help you deploy your P2P backend node to the cloud so external users can actually connect to your network.

## **Why This is Needed**
- Your frontend is deployed on Vercel (public)
- Your backend is currently only running locally (localhost)
- External users can't connect to localhost on your machine
- The "Start Node" button fails because it can't reach the backend

## **Deployment Options**

### **Option 1: DigitalOcean Droplet (Recommended - $5/month)**
```bash
# 1. Create a new droplet
# 2. SSH into it
ssh root@YOUR_SERVER_IP

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Clone your repo
git clone https://github.com/mrobin88/onusone-p2p.git
cd onusone-p2p

# 5. Run deployment script
chmod +x deploy-backend.sh
./deploy-backend.sh
```

### **Option 2: AWS EC2 (Free tier available)**
```bash
# 1. Launch EC2 instance
# 2. Configure security group to allow ports 8888-8890
# 3. SSH into instance
ssh -i your-key.pem ubuntu@YOUR_INSTANCE_IP

# 4. Follow same steps as DigitalOcean
```

### **Option 3: Google Cloud Platform**
```bash
# 1. Create Compute Engine instance
# 2. Allow HTTP/HTTPS traffic
# 3. SSH into instance
# 4. Follow deployment steps
```

## **Required Environment Variables**

### **Add to Vercel Dashboard:**
```
NEXT_PUBLIC_P2P_BACKEND_URL=http://YOUR_SERVER_IP:8888
NEXT_PUBLIC_P2P_BACKEND_URL_2=http://YOUR_SERVER_IP:8889
NEXT_PUBLIC_P2P_BACKEND_URL_3=http://YOUR_SERVER_IP:8890
```

### **Add to your backend server (.env file):**
```bash
NODE_ENV=production
NODE_PORT=8888
P2P_PORT=8889
HTTP_PORT=8888
ENABLE_WEBSOCKETS=true
ENABLE_MDNS=true
LOG_LEVEL=info
ENABLE_METRICS=true
```

## **Verification Steps**

### **1. Check Backend Health**
```bash
curl http://YOUR_SERVER_IP:8888/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "nodeId": "server-abc123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "p2pStatus": "running",
  "networkHealth": 95
}
```

### **2. Check WebSocket Endpoint**
```bash
# Test WebSocket connection
wscat -c ws://YOUR_SERVER_IP:8888/ws/edge-node
```

### **3. Test Frontend Connection**
- Deploy frontend with new environment variables
- Visit your live site from a different computer
- Click "Start Node" button
- Should connect successfully to your backend

## **Security Considerations**

### **Firewall Rules**
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 8888/tcp  # HTTP API
ufw allow 8889/tcp  # P2P Protocol
ufw allow 8890/tcp  # WebSocket
ufw enable
```

### **SSL/TLS (Optional but Recommended)**
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx config to use HTTPS
```

## **Monitoring & Maintenance**

### **Check Backend Status**
```bash
# View logs
docker logs onusone-p2p-backend

# Check container status
docker ps -a

# Restart if needed
docker restart onusone-p2p-backend
```

### **Update Backend**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy-backend.sh
```

## **Troubleshooting**

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :8888

# Kill process if needed
sudo kill -9 PROCESS_ID
```

#### **2. Firewall Blocking**
```bash
# Check firewall status
sudo ufw status

# Allow specific ports
sudo ufw allow 8888/tcp
```

#### **3. Docker Permission Issues**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
ssh root@YOUR_SERVER_IP
```

## **Cost Estimation**

| Provider | Instance Type | Monthly Cost | RAM | CPU |
|----------|---------------|--------------|-----|-----|
| DigitalOcean | Basic Droplet | $5 | 1GB | 1 vCPU |
| AWS EC2 | t3.micro | $0 (Free tier) | 1GB | 2 vCPU |
| Google Cloud | e2-micro | $0 (Free tier) | 1GB | 2 vCPU |
| Linode | Nanode | $5 | 1GB | 1 vCPU |

## **Next Steps After Deployment**

1. **Test the connection** from your local machine
2. **Deploy frontend** with new environment variables
3. **Test from external devices** to ensure it works
4. **Monitor backend logs** for any issues
5. **Scale up** if you need more capacity

## **Support**

If you encounter issues:
1. Check the backend logs: `docker logs onusone-p2p-backend`
2. Verify firewall rules are correct
3. Ensure ports are open and accessible
4. Check that environment variables are set correctly

---

**🎯 Goal**: Get your P2P backend running on a public server so external users can actually join your network!
