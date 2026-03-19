"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";

export function CameraCapture({
  onCapture,
  currentPreview,
}: {
  onCapture: (blob: Blob) => void;
  currentPreview: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      fileInputRef.current?.click();
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
        closeCamera();
      },
      "image/jpeg",
      0.85
    );
  }, [onCapture, closeCamera]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onCapture(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {isCameraOpen ? (
        <div
          className="animate-fade-in"
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "1rem",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              aspectRatio: "1",
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              onClick={closeCamera}
              className="btn-ghost"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
              }}
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="button"
              onClick={takePhoto}
              className="btn-primary"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "2rem",
              }}
            >
              <Camera size={18} />
              Capture
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openCamera}
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "2px dashed var(--border-light)",
            background: currentPreview ? "none" : "var(--surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transition: "all 0.2s ease",
            position: "relative",
          }}
        >
          {currentPreview ? (
            <>
              <img
                src={currentPreview}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.opacity = "0";
                }}
              >
                <RefreshCw size={20} color="white" />
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Camera size={24} color="var(--text-muted)" />
              <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                Photo
              </span>
            </div>
          )}
        </button>
      )}
    </>
  );
}
