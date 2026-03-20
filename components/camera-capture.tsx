"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className="relative w-full overflow-hidden rounded-2xl bg-black animate-fade-in">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="block aspect-square w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
            <button
              type="button"
              onClick={closeCamera}
              className="btn-ghost bg-black/50 px-4 py-2 text-[0.8125rem] backdrop-blur"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="button"
              onClick={takePhoto}
              className="btn-primary rounded-full px-6 py-3"
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
          className={cn(
            "group relative flex h-25 w-25 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/15 transition-all duration-200",
            currentPreview ? "bg-transparent" : "bg-white/5"
          )}
        >
          {currentPreview ? (
            <>
              <img
                src={currentPreview}
                alt="Profile"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <RefreshCw size={20} color="white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera size={24} color="var(--text-muted)" />
              <span className="text-[0.625rem] text-(--text-muted)">
                Photo
              </span>
            </div>
          )}
        </button>
      )}
    </>
  );
}
