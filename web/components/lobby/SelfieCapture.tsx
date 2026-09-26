"use client";

import { Camera, Check, RefreshCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type SelfieCaptureProps = {
  selfieDataUrl?: string;
  onSave: (selfieDataUrl: string) => void;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function SelfieCapture({ selfieDataUrl, onSave }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraCycle, setCameraCycle] = useState(0);

  useEffect(() => {
    if (!isOpen || preview) return;

    let cancelled = false;
    const video = videoRef.current;

    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("UNSUPPORTED_CAMERA");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        if (video) video.srcObject = stream;
        setIsStarting(false);
      } catch (error: unknown) {
        if (cancelled) return;
        const name = error instanceof Error ? error.name : "";
        setCameraError(
          name === "UNSUPPORTED_CAMERA"
            ? "This browser does not support live camera access."
            : name === "NotAllowedError"
            ? "Camera access was blocked. Allow camera access in your browser settings and try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "We could not start the camera. Check your camera and try again.",
        );
        setIsStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (video) video.srcObject = null;
      setIsStarting(false);
      setIsCameraReady(false);
    };
  }, [cameraCycle, isOpen, preview]);

  function closeCapture() {
    stopStream(streamRef.current);
    streamRef.current = null;
    setIsCameraReady(false);
    setIsStarting(false);
    setPreview(null);
    setCameraError(null);
    setIsOpen(false);
  }

  function openCapture() {
    setPreview(null);
    setCameraError(null);
    setIsStarting(true);
    setIsCameraReady(false);
    setIsOpen(true);
    setCameraCycle((current) => current + 1);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError("The camera is still warming up. Try again in a moment.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("We could not capture that frame. Please try again.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
    stopStream(streamRef.current);
    streamRef.current = null;
    setIsCameraReady(false);
  }

  function retakePhoto() {
    setPreview(null);
    setCameraError(null);
    setIsStarting(true);
    setIsCameraReady(false);
    setCameraCycle((current) => current + 1);
  }

  function keepPhoto() {
    if (!preview) return;
    onSave(preview);
    closeCapture();
  }

  return (
    <>
      <Card className="selfie-card">
        <div className="selfie-card-copy">
          <span className="eyebrow">Your trip avatar</span>
          <strong>{selfieDataUrl ? "Avatar ready" : "Set your trip avatar"}</strong>
          <p>Take a live selfie so the crew can recognize you in the waiting room.</p>
        </div>
        <Button variant="secondary" type="button" onClick={openCapture}>
          <Camera size={17} aria-hidden="true" />
          {selfieDataUrl ? "Retake selfie" : "Take selfie"}
        </Button>
      </Card>

      {isOpen && (
        <div className="selfie-modal-backdrop" role="presentation">
          <section
            className="selfie-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="selfie-modal-title"
          >
            <button
              className="icon-button selfie-close"
              type="button"
              onClick={closeCapture}
              aria-label="Close selfie capture"
            >
              <X size={19} aria-hidden="true" />
            </button>
            <div className="selfie-modal-heading">
              <span className="eyebrow">Live camera only</span>
              <h2 id="selfie-modal-title">Set your trip avatar</h2>
              <p>Your camera turns off as soon as you close this window.</p>
            </div>

            <div className="selfie-camera-frame">
              {preview ? (
                <img className="selfie-preview" src={preview} alt="Your selfie preview" />
              ) : (
                <video
                  ref={videoRef}
                  className="selfie-video"
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => setIsCameraReady(true)}
                  aria-label="Live selfie camera preview"
                />
              )}
              {isStarting && !preview && (
                <span className="selfie-camera-status">Starting camera…</span>
              )}
            </div>

            <canvas ref={canvasRef} className="selfie-canvas" aria-hidden="true" />

            {cameraError && (
              <p className="selfie-error" role="alert">
                {cameraError}
              </p>
            )}

            {preview ? (
              <div className="selfie-modal-actions">
                <Button variant="ghost" type="button" onClick={retakePhoto}>
                  <RefreshCcw size={17} aria-hidden="true" /> Retake
                </Button>
                <Button variant="secondary" type="button" onClick={keepPhoto}>
                  <Check size={17} aria-hidden="true" /> Looks good
                </Button>
              </div>
            ) : cameraError ? (
              <Button variant="secondary" type="button" onClick={retakePhoto}>
                <RefreshCcw size={17} aria-hidden="true" /> Try again
              </Button>
            ) : (
              <Button
                variant="secondary"
                type="button"
                onClick={capturePhoto}
                disabled={!isCameraReady}
              >
                <Camera size={17} aria-hidden="true" /> Capture
              </Button>
            )}
          </section>
        </div>
      )}
    </>
  );
}
