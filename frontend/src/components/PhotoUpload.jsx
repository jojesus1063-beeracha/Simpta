import React, { useRef, useState } from "react";

const CLOUD_NAME = "cnciokku";
const UPLOAD_PRESET = "whqfiivj";

const PhotoUpload = ({ photoUrl, onUploaded, size = 48 }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) onUploaded(data.secure_url);
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100"
        style={{ width: size, height: size }}
        title="Upload photo"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-slate-400">+</span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] text-white">…</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
};

export default PhotoUpload;
