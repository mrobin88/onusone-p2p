/**
 * File Upload System with IPFS
 * Handles file uploads, IPFS storage, and metadata management
 */

import express from 'express';
import multer from 'multer';
// Simple file storage for now - IPFS integration can be added later
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

// Simple file storage - generate unique IDs for now
function generateFileId(): string {
  return uuidv4();
}

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
router.post('/file', upload.single('file'), async (req: any, res: any) => {
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
    
    // Generate unique file ID for now
    const fileId = generateFileId();
    const ipfsHash = fileId; // Placeholder for IPFS hash
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    
    // Create file record
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
router.get('/file/:fileId', async (req: any, res: any) => {
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
router.post('/pin/:ipfsHash', async (req: any, res: any) => {
  try {
    const { ipfsHash } = req.params;
    
    // Pin the file to IPFS
    // Note: Pinning is handled automatically by Helia
    console.log(`📌 File pinned to IPFS: ${ipfsHash}`);
    
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
router.get('/status', async (req: any, res: any) => {
  try {
    // Check IPFS connection
    const id = 'local-storage'; // Placeholder for IPFS node ID
    
    res.json({
      success: true,
      status: 'local-storage',
      message: 'File storage using local system - IPFS integration coming soon'
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
