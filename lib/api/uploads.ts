"use client"

import { apiRequest } from "@/lib/api/client"

type UploadTarget = "avatar" | "organizerLogo" | "organizerKycPdf" | "eventAsset"

type PresignedUploadPayload = {
  objectKey: string
  publicUrl: string
  uploadUrl: string
  method: "PUT"
}

export async function uploadFile(file: File, target: UploadTarget) {
  const response = await apiRequest<PresignedUploadPayload>("/uploads/sign", {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      target,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  })

  const uploadResponse = await fetch(response.uploadUrl, {
    method: response.method,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error("Upload failed. Please try again.")
  }

  return {
    secureUrl: response.publicUrl,
    publicId: response.objectKey,
  }
}
