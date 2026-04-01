import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif'
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const UploadMaterials = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.warning(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > MAX_SIZE) {
        toast.warning(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }))]);
  };

  const handleRemoveFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    for (const fileObj of files) {
      if (fileObj.status === 'uploaded') continue;

      const formData = new FormData();
      formData.append('file', fileObj.file);
      formData.append('name', fileObj.file.name);
      formData.append('type', fileObj.file.type);
      formData.append('size', fileObj.file.size);

      try {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        await axios.post(`${API_URL}/api/uploads`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setFiles(prev => prev.map(f => 
              f.id === fileObj.id ? { ...f, progress } : f
            ));
          }
        });

        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploaded', progress: 100 } : f
        ));
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'error', progress: 0 } : f
        ));
      }
    }

    setUploading(false);
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    return '📁';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-[#1A2E16] mb-1">Upload Materials</h2>
        <p className="text-[#7A8A76]">Upload documents, images, and teaching materials</p>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="bg-white border-2 border-dashed border-[#E4DFD5] rounded-xl p-12 text-center cursor-pointer hover:border-[#2D5A27] hover:bg-[#FDFBF7] transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-[#8E9E82] mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-[#1A2E16] mb-2">
          Drag & drop files here
        </h3>
        <p className="text-[#7A8A76] mb-4">or click to browse</p>
        <p className="text-sm text-[#A0A0A0]">
          Supported: PDF, Word, Images (max 10MB each)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 bg-white border border-[#E4DFD5] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E4DFD5] flex items-center justify-between">
            <h3 className="font-heading font-semibold text-[#1A2E16]">
              Selected Files ({files.length})
            </h3>
            <button
              onClick={handleUpload}
              disabled={uploading || files.every(f => f.status === 'uploaded')}
              className="flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg font-medium hover:bg-[#21441C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload All
                </>
              )}
            </button>
          </div>

          <div className="divide-y divide-[#E4DFD5]">
            {files.map((fileObj) => (
              <div key={fileObj.id} className="p-4 flex items-center gap-4">
                <span className="text-2xl">{getFileIcon(fileObj.file.type)}</span>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1A2E16] truncate">{fileObj.file.name}</p>
                  <p className="text-sm text-[#7A8A76]">{formatSize(fileObj.file.size)}</p>
                  
                  {fileObj.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="h-2 bg-[#E4DFD5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2D5A27] transition-all duration-300"
                          style={{ width: `${fileObj.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#7A8A76] mt-1">{fileObj.progress}% uploaded</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {fileObj.status === 'uploaded' && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      Uploaded
                    </span>
                  )}
                  {fileObj.status === 'error' && (
                    <span className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Failed
                    </span>
                  )}
                  {fileObj.status !== 'uploading' && (
                    <button
                      onClick={() => handleRemoveFile(fileObj.id)}
                      className="p-1 text-[#7A8A76] hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-[#F8F8F8] rounded-lg">
        <h4 className="font-medium text-[#1A2E16] mb-2">Supported File Types:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-sm text-[#7A8A76]">
            <span>📄</span> PDF Documents
          </div>
          <div className="flex items-center gap-2 text-sm text-[#7A8A76]">
            <span>📝</span> Word Documents
          </div>
          <div className="flex items-center gap-2 text-sm text-[#7A8A76]">
            <span>🖼️</span> Images (JPG, PNG)
          </div>
          <div className="flex items-center gap-2 text-sm text-[#7A8A76]">
            <span>📁</span> Max 10MB each
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadMaterials;
