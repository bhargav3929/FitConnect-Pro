"use client"

import { useRef, useState, useCallback } from "react"
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { uploadImageFile, validateImageFile } from "@fitconnect/shared/firebase/storage"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ImageUploadProps {
    /** Current image URL (controlled). */
    value?: string
    /** Called with the new download URL after a successful upload, or "" when removed. */
    onChange: (url: string) => void
    /** Storage folder to upload into (e.g. "trainers" or "avatars/<uid>"). */
    folder: string
    /** Stable id for the storage path (e.g. trainerId / uid). Optional. */
    id?: string
    /** Fallback initials shown when no image is present. */
    fallback?: string
    shape?: "circle" | "square"
    disabled?: boolean
    className?: string
}

export function ImageUpload({
    value,
    onChange,
    folder,
    id,
    fallback,
    shape = "circle",
    disabled = false,
    className,
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    // Instant local preview while the real upload is in flight
    const [localPreview, setLocalPreview] = useState<string | null>(null)

    const preview = localPreview || value
    const radius = shape === "circle" ? "rounded-full" : "rounded-2xl"

    const handleFile = useCallback(
        async (file: File) => {
            const validationError = validateImageFile(file)
            if (validationError) {
                toast.error(validationError)
                return
            }

            const objectUrl = URL.createObjectURL(file)
            setLocalPreview(objectUrl)
            setIsUploading(true)
            setProgress(0)

            try {
                const { url } = await uploadImageFile(file, folder, {
                    id,
                    onProgress: setProgress,
                })
                onChange(url)
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Upload failed. Please try again."
                toast.error(message)
                setLocalPreview(null)
            } finally {
                setIsUploading(false)
                URL.revokeObjectURL(objectUrl)
                setLocalPreview((prev) => (prev === objectUrl ? null : prev))
            }
        },
        [folder, id, onChange],
    )

    const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        e.target.value = "" // allow re-selecting the same file
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (disabled || isUploading) return
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange("")
        setLocalPreview(null)
    }

    const openPicker = () => {
        if (!disabled && !isUploading) inputRef.current?.click()
    }

    return (
        <div className={cn("flex items-center gap-4", className)}>
            <button
                type="button"
                onClick={openPicker}
                onDragOver={(e) => {
                    e.preventDefault()
                    if (!disabled && !isUploading) setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                disabled={disabled}
                className={cn(
                    "group relative h-24 w-24 flex-shrink-0 overflow-hidden border transition-all duration-300",
                    radius,
                    isDragging
                        ? "border-terra-400 ring-4 ring-terra-400/15"
                        : "border-peach-400/30 hover:border-terra-400/50",
                    "bg-peach-200/40 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed",
                )}
                aria-label="Upload image"
            >
                {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : fallback ? (
                    <span className="text-2xl font-bold text-olive-400/70">{fallback}</span>
                ) : (
                    <ImagePlus className="h-7 w-7 text-olive-300/60 transition-colors group-hover:text-terra-400" />
                )}

                {/* Hover overlay (when an image exists) */}
                {preview && !isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-warmDark-900/0 opacity-0 transition-all duration-300 group-hover:bg-olive-600/40 group-hover:opacity-100">
                        <Camera className="h-6 w-6 text-peach-50" />
                    </div>
                )}

                {/* Uploading overlay with progress */}
                {isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-olive-600/55 backdrop-blur-[1px]">
                        <Loader2 className="h-5 w-5 animate-spin text-peach-50" />
                        <span className="text-[10px] font-bold tracking-wider text-peach-50">{progress}%</span>
                    </div>
                )}
            </button>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={openPicker}
                        disabled={disabled || isUploading}
                        className="px-3.5 py-2 bg-peach-200/60 text-olive-600 font-bold text-[11px] tracking-[0.12em] uppercase hover:bg-peach-300/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Camera className="h-3.5 w-3.5" />
                        {preview ? "Change" : "Upload"}
                    </button>
                    {preview && !isUploading && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="p-2 text-olive-300 hover:text-red-500 hover:bg-red-500/8 transition-all"
                            aria-label="Remove image"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <p className="text-[11px] leading-relaxed text-olive-300/70">
                    JPG, PNG, WebP or GIF · up to 5MB
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onSelect}
                className="hidden"
            />
        </div>
    )
}
