"use client";

import { useQuery } from "convex/react";
import { User } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function ProfilePhoto({
  userId,
  size = 36,
  onClick,
}: {
  userId: string;
  size?: number;
  onClick?: () => void;
}) {
  const user = useQuery(api.auth.getUserById, {
    userId: userId as Id<"users">,
  });
  const photoUrl = useQuery(
    api.auth.getProfilePhotoUrl,
    user?.profilePhotoId ? { storageId: user.profilePhotoId } : "skip"
  );

  return (
    <button
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: "2px solid var(--border-light)",
        background: "var(--surface)",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Profile"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <User size={size * 0.5} color="var(--text-muted)" />
      )}
    </button>
  );
}
