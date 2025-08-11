import React, { useState, useRef, useEffect } from 'react';
import { LocalFileSharing, SharedFile, FileTransfer } from '../lib/local-file-sharing';
import { EdgeNode } from '../lib/edge-node';

interface FileSharingProps {
  node: EdgeNode;
}

export default function FileSharing({ node }: FileSharingProps) {
  const [fileSharing, setFileSharing] = useState<LocalFileSharing | null>(null);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [activeTransfers, setActiveTransfers] = useState<FileTransfer[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (node) {
      const sharing = new LocalFileSharing(node);
      setFileSharing(sharing);
      
      // Set up message handlers
      node.onMessage('FILE_SHARED', handleFileShared);
      node.onMessage('FILE_REQUEST', handleFileRequest);
      node.onMessage('FILE_CHUNK', handleFileChunk);
      node.onMessage('FILE_COMPLETE', handleFileComplete);
      node.onMessage('FILE_NOT_FOUND', handleFileNotFound);
      
      // Load initial state
      updateFileList();
      updateTransferList();
    }
  }, [node]);

  const handleFileShared = (message: any) => {
    console.log('📁 New file shared:', message.data.file);
    updateFileList();
  };

  const handleFileRequest = async (message: any) => {
    console.log('📥 File request received:', message);
    if (fileSharing) {
      await fileSharing.handleFileRequest(message);
    }
  };

  const handleFileChunk = async (message: any) => {
    console.log('📦 File chunk received:', message);
    if (fileSharing) {
      await fileSharing.handleFileChunk(message);
      updateTransferList();
    }
  };

  const handleFileComplete = async (message: any) => {
    console.log('✅ File transfer complete:', message);
    if (fileSharing) {
      await fileSharing.handleFileComplete(message);
      updateFileList();
      updateTransferList();
    }
  };

  const handleFileNotFound = (message: any) => {
    console.log('❌ File not found:', message);
    // Update transfer status to failed
    const { transferId } = message.data;
    setActiveTransfers(prev => 
      prev.map(t => t.id === transferId ? { ...t, status: 'failed' } : t)
    );
  };

  const updateFileList = () => {
    if (fileSharing) {
      setSharedFiles(fileSharing.getSharedFiles());
    }
  };

  const updateTransferList = () => {
    if (fileSharing) {
      setActiveTransfers(fileSharing.getActiveTransfers());
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleShareFile = async () => {
    if (!selectedFile || !fileSharing) return;
    
    setIsSharing(true);
    try {
      const sharedFile = await fileSharing.shareFile(selectedFile);
      console.log('✅ File shared successfully:', sharedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      updateFileList();
    } catch (error) {
      console.error('❌ Failed to share file:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadFile = async (file: SharedFile) => {
    if (!fileSharing) return;
    
    try {
      // Create blob from chunks
      const chunks = file.chunks.sort((a, b) => a.index - b.index);
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.data.byteLength, 0);
      const combined = new Uint8Array(totalSize);
      
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(new Uint8Array(chunk.data), offset);
        offset += chunk.data.byteLength;
      }
      
      // Create download link
      const blob = new Blob([combined], { type: file.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded:', file.name);
    } catch (error) {
      console.error('❌ Failed to download file:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTransferStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'transferring': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 Local File Sharing Network</h2>
      
      {/* File Upload Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📤 Share a File</h3>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSharing}
          />
          <button
            onClick={handleShareFile}
            disabled={!selectedFile || isSharing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? '🔄 Sharing...' : '📤 Share File'}
          </button>
        </div>
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        )}
      </div>

      {/* Shared Files Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📁 Shared Files ({sharedFiles.length})
        </h3>
        {sharedFiles.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No files shared yet</p>
        ) : (
          <div className="space-y-2">
            {sharedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(file.size)} • {file.type} • Shared by {file.owner}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(file.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  📥 Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Transfers Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          🔄 Active Transfers ({activeTransfers.length})
        </h3>
        {activeTransfers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active transfers</p>
        ) : (
          <div className="space-y-2">
            {activeTransfers.map((transfer) => (
              <div key={transfer.id} className="p-3 bg-white rounded-md border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">File ID: {transfer.fileId}</span>
                  <span className={`font-medium ${getTransferStatusColor(transfer.status)}`}>
                    {transfer.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>From: {transfer.sender}</span>
                  <span>To: {transfer.receiver}</span>
                  <span>Progress: {transfer.progress.toFixed(1)}%</span>
                </div>
                {transfer.status === 'transferring' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${transfer.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Status */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          🌐 Connected to local P2P network • Node ID: {node?.getNodeId() || 'Connecting...'}
        </p>
      </div>
    </div>
  );
}
