"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Loader2, X } from "lucide-react"
import Image from "next/image"

interface FileViewerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fileUrl: string
    fileName: string
    fileType?: string
}

export function FileViewerDialog({
    open,
    onOpenChange,
    fileUrl,
    fileName,
    fileType,
}: FileViewerDialogProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const isImage = fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
    const isPdf = fileType?.includes("pdf") || fileName.endsWith(".pdf")

    const handleDownload = () => {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleOpenNewTab = () => {
        window.open(fileUrl, "_blank", "noopener,noreferrer")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg truncate pr-8">{fileName}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDownload}
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleOpenNewTab}
                                className="gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="relative bg-muted/30" style={{ minHeight: "400px", maxHeight: "calc(90vh - 120px)" }}>
                    {isImage && (
                        <div className="relative w-full h-full flex items-center justify-center p-6">
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {error ? (
                                <div className="text-center">
                                    <p className="text-muted-foreground mb-4">Failed to load image</p>
                                    <Button onClick={handleOpenNewTab}>Open in New Tab</Button>
                                </div>
                            ) : (
                                <div className="relative w-full" style={{ maxHeight: "calc(90vh - 200px)" }}>
                                    <img
                                        src={fileUrl}
                                        alt={fileName}
                                        className="max-w-full max-h-full mx-auto rounded-lg object-contain"
                                        style={{ maxHeight: "calc(90vh - 200px)" }}
                                        onLoad={() => setLoading(false)}
                                        onError={() => {
                                            setLoading(false)
                                            setError(true)
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {isPdf && (
                        <div className="w-full h-full">
                            <iframe
                                src={`${fileUrl}#toolbar=0`}
                                className="w-full border-0"
                                style={{ height: "calc(90vh - 120px)" }}
                                title={fileName}
                            />
                        </div>
                    )}

                    {!isImage && !isPdf && (
                        <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                            <p className="text-muted-foreground mb-4">
                                Preview not available for this file type
                            </p>
                            <div className="flex gap-2">
                                <Button onClick={handleDownload} className="gap-2">
                                    <Download className="w-4 h-4" />
                                    Download File
                                </Button>
                                <Button onClick={handleOpenNewTab} variant="outline" className="gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    Open in New Tab
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
