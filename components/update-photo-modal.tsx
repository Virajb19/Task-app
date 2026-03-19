"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutationWithToast } from "@/lib/use-mutation-toast";
import { CameraCapture } from "@/components/camera-capture";

export function UpdatePhotoModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  const generateUploadUrl = useMutation(api.auth.generateUploadUrl);
  const updateProfilePhoto = useMutationWithToast(api.auth.updateProfilePhoto, {
    loading: "Uploading photo…",
    success: "Photo updated!",
  });

  const handlePhotoCapture = (blob: Blob) => {
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
  };

  const handleSave = async () => {
    if (!photoBlob) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photoBlob.type },
        body: photoBlob,
      });
      const { storageId } = await result.json();
      await updateProfilePhoto({
        userId: userId as Id<"users">,
        storageId,
      });
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong animate-fade-in-up"
        style={{
          padding: "2rem",
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Update Profile Photo
        </h2>
        <CameraCapture
          onCapture={handlePhotoCapture}
          currentPreview={photoPreview}
        />
        <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!photoBlob || uploading}
            style={{ flex: 1 }}
          >
            {uploading ? <div className="spinner" /> : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
