/**
 * File Upload System with IPFS
 * Handles file uploads, IPFS storage, and metadata management
 */

import express from 'express';
import multer from 'multer';
import { create } from 'ipfs-http-client';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
      fileFilter: (req: any, file: any, cb: any) => {
      // Allow common file types
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/markdown', 'application/pdf',
        'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed'), false);
      }
    }
});

// IPFS configuration
const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.IPFS_INFURA_PROJECT_ID}:${process.env.IPFS_INFURA_PROJECT_SECRET}`
    ).toString('base64')}`
  }
});

interface FileUploadRequest {
  file: any;
  messageId?: string;
  userWallet: string;
  description?: string;
}

interface FileUploadResponse {
  success: boolean;
  fileId: string;
  ipfsHash: string;
  ipfsUrl: string;
  metadata: any;
}

/**
 * Upload file to IPFS
 * POST /api/upload/file
 */
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided' 
      });
    }
    
    const { messageId, userWallet, description } = req.body;
    const file = req.file;
    
    console.log(`📁 File upload: ${file.originalname} (${file.size} bytes)`);
    
    // Upload to IPFS
    const ipfsResult = await ipfs.add(file.buffer, {
      pin: true
    });
    
    const ipfsHash = ipfsResult.cid.toString();
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    
    // Create file record
    const fileId = uuidv4();
    const fileMetadata = {
      id: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      ipfsHash,
      ipfsUrl,
      messageId,
      userWallet,
      description,
      uploadedAt: new Date().toISOString(),
      pinStatus: 'pinned'
    };
    
    // TODO: Save to Supabase database
    console.log(`✅ File uploaded to IPFS: ${ipfsHash}`);
    
    res.json({
      success: true,
      fileId,
      ipfsHash,
      ipfsUrl,
      metadata: fileMetadata
    });
    
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload file' 
    });
  }
});

/**
 * Get file metadata
 * GET /api/upload/file/:fileId
 */
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // TODO: Fetch from Supabase database
    const mockFile = {
      id: fileId,
      originalName: 'example.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      ipfsHash: 'QmExampleHash',
      ipfsUrl: 'https://ipfs.io/ipfs/QmExampleHash',
      messageId: 'msg123',
      userWallet: 'user123',
      description: 'Example file',
      uploadedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      file: mockFile
    });
    
  } catch (error) {
    console.error('Failed to fetch file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch file' 
    });
  }
});

/**
 * Pin file to IPFS (ensure it stays available)
 * POST /api/upload/pin/:ipfsHash
 */
router.post('/pin/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;
    
    // Pin the file to IPFS
    await ipfs.pin.add(ipfsHash);
    
    console.log(`📌 File pinned: ${ipfsHash}`);
    
    res.json({
      success: true,
      message: 'File pinned successfully'
    });
    
  } catch (error) {
    console.error('Failed to pin file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to pin file' 
    });
  }
});

/**
 * Get IPFS gateway status
 * GET /api/upload/status
 */
router.get('/status', async (req, res) => {
  try {
    // Check IPFS connection
    const id = await ipfs.id();
    
    res.json({
      success: true,
      ipfsStatus: 'connected',
      nodeId: id.id,
      version: id.agentVersion
    });
    
  } catch (error) {
    console.error('IPFS status check failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'IPFS not connected' 
    });
  }
});

export default router;
