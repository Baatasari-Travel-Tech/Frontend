"use client"

import { apiRequest } from "@/lib/api/client"
import type { ApiEnvelope } from "@/types/api"

type UploadTarget = "organizerLogo" | "organizerKycPdf"

type PresignedUploadPayload = {
  objectKey: string
  publicUrl: string
  uploadUrl: string
  method: "PUT"
}

export async function uploadFile(file: File, target: UploadTarget) {
  const response = await apiRequest<ApiEnvelope<PresignedUploadPayload>>("/uploads/sign", {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      target,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  })

  const presigned = response.data

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: presigned.method,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error("Upload failed. Please try again.")
  }

  return {
    secureUrl: presigned.publicUrl,
    publicId: presigned.objectKey,
  }
}

type AvatarUploadPayload = {
  avatar: {
    objectKey: string
    publicUrl: string | null
    version: number
  }
}

const uploadAvatarImage = async (path: "/user/avatar" | "/organizer/avatar", file: File) => {
  const response = await apiRequest<ApiEnvelope<AvatarUploadPayload>>(path, {
    method: "PUT",
    auth: true,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  })

  return response.data.avatar
}

export const uploadUserAvatarImage = (file: File) => uploadAvatarImage("/user/avatar", file)

export const uploadOrganizerAvatarImage = (file: File) => uploadAvatarImage("/organizer/avatar", file)

type EventCoverUploadPayload = {
  cover: {
    eventId: string
    objectKey: string
    publicUrl: string
    version: number
  }
}

export async function uploadEventCoverImage(eventId: string, file: File) {
  const response = await apiRequest<ApiEnvelope<EventCoverUploadPayload>>(
    `/organizer/events/${eventId}/cover`,
    {
      method: "PUT",
      auth: true,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    }
  )

  return response.data.cover
}
