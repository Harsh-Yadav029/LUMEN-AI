import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext.jsx';

export default function ProfileModal({ onClose }) {
  // FIX 1: destructure 'user' not 'currentUser' — matches AuthContext export
  const { user, updateUserProfile, getDisplayName, getUsername } = useAuth();

  const [displayName, setDisplayName] = useState(getDisplayName() || '');
  const [username,    setUsername]    = useState(getUsername() || '');
  // FIX 2: use user?.photoURL not currentUser?.photoURL
  const [preview,     setPreview]     = useState(user?.photoURL || null);
  const [imageFile,   setImageFile]   = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  const fileRef = useRef();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(val);
  };

  const uploadToCloudinary = async (file) => {
    setUploading(true);
    
    // 1. Get the authentication token from your user object
    // If using Firebase, it's usually: const token = await user.getIdToken();
    const token = await user?.getIdToken(); 

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/upload-avatar', {
      method: 'POST',
      headers: {
        // 2. Attach the token so 'requireAuth' middleware accepts the request
        'Authorization': `Bearer ${token}` 
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Image upload failed');
    }

    const data = await res.json();
    setUploading(false);
    return data.url;
  };

  const handleSave = async () => {
    if (!displayName.trim()) return setError('Display name is required');
    if (username && (username.length < 3 || username.length > 20)) {
      return setError('Username must be 3–20 characters');
    }

    setSaving(true);
    setError('');
    try {
      // FIX 3: use user?.photoURL not currentUser?.photoURL
      let photoURL = user?.photoURL || null;

      if (imageFile) {
        photoURL = await uploadToCloudinary(imageFile);
      }

      // FIX 4: AuthContext updateUserProfile takes an OBJECT not positional args
      const result = await updateUserProfile({
        displayName: displayName.trim(),
        username:    username.trim(),
        photoURL,
      });

      if (result && !result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // FIX 5: use user?.email not currentUser?.email
  const initials = (getDisplayName() || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md mx-4 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937]">
          <h2 className="text-[#E5E7EB] font-semibold text-base tracking-tight">Edit profile</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937] transition-colors text-lg leading-none"
          >×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative w-20 h-20 rounded-full cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[#1F2937]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#10B981]/20 border-2 border-[#1F2937] flex items-center justify-center text-[#10B981] font-semibold text-xl">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? (
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                )}
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF]">Click to upload · max 5MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                className="w-full bg-[#0B0F14] border border-[#1F2937] rounded-lg px-3.5 py-2.5 text-sm text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#10B981] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#4B5563]">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="yourhandle"
                  maxLength={20}
                  className="w-full bg-[#0B0F14] border border-[#1F2937] rounded-lg pl-8 pr-3.5 py-2.5 text-sm text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#10B981] transition-colors"
                />
              </div>
              <p className="mt-1 text-xs text-[#4B5563]">Letters, numbers, _ and - only</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Email</label>
              <input
                type="email"
                // FIX 6: user?.email not currentUser?.email
                value={user?.email || ''}
                readOnly
                className="w-full bg-[#0B0F14]/50 border border-[#1F2937] rounded-lg px-3.5 py-2.5 text-sm text-[#4B5563] cursor-not-allowed"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-3 py-2">
              Profile updated successfully
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#1F2937] text-sm text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-lg bg-[#10B981] text-[#0B0F14] text-sm font-semibold hover:bg-[#34D399] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving || uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {uploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}