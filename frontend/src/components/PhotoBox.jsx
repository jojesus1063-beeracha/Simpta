import React, { useEffect, useState } from "react";
import api from "../api/axios";
import PhotoUpload from "./PhotoUpload";
import { useAuth } from "../context/AuthContext";

const ROTATE_INTERVAL_MS = 4000;

const PhotoBox = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    const res = await api.get("/photobox");
    setPhotos(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [photos.length]);

  const handleAdd = async (url) => {
    await api.post("/photobox", { url });
    load();
  };

  const handleRemove = async (id) => {
    await api.delete(`/photobox/${id}`);
    load();
  };

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative h-56 bg-slate-100">
        {photos.length > 0 ? (
          <img src={photos[index]?.url} alt="" className="h-full w-full object-cover transition-all" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No photos yet.</div>
        )}
        {user?.role === "admin" && (
          <button
            onClick={() => setEditing((e) => !e)}
            className="absolute right-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow hover:bg-white"
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="border-t border-slate-100 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">Add a photo</p>
          <PhotoUpload photoUrl="" onUploaded={handleAdd} size={48} />
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {photos.map((p) => (
                <div key={p._id} className="relative">
                  <img src={p.url} alt="" className="h-16 w-full rounded-lg object-cover" />
                  <button
                    onClick={() => handleRemove(p._id)}
                    className="absolute right-1 top-1 rounded-full bg-rose-500 px-1.5 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoBox;
