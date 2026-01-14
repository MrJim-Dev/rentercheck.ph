"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiInputProps {
    values: string[]
    onChange: (values: string[]) => void
    placeholder?: string
    maxItems?: number
    icon?: React.ReactNode
    validateFn?: (value: string) => boolean
    normalizeFn?: (value: string) => string
    className?: string
    inputClassName?: string
    disabled?: boolean
    addLabel?: string
    validationMessage?: string
}

export function MultiInput({
    values,
    onChange,
    placeholder = "Enter value...",
    maxItems = 5,
    icon,
    validateFn,
    normalizeFn,
    className,
    inputClassName,
    disabled = false,
    addLabel = "Add another",
    validationMessage = "Invalid format",
}: MultiInputProps) {
    const [inputValue, setInputValue] = useState("")
    const [showInput, setShowInput] = useState(values.length === 0)
    const [error, setError] = useState<string | null>(null)

    const handleAdd = useCallback(() => {
        const trimmed = inputValue.trim()
        if (!trimmed) {
            setError(null)
            return
        }

        // Validate if function provided
        if (validateFn && !validateFn(trimmed)) {
            setError(validationMessage)
            return
        }

        // Clear any error
        setError(null)

        // Normalize if function provided
        const normalized = normalizeFn ? normalizeFn(trimmed) : trimmed

        // Check for duplicates
        if (values.includes(normalized)) {
            setError("Already added")
            setInputValue("")
            return
        }

        // Add to values
        onChange([...values, normalized])
        setInputValue("")
        
        // After adding, hide input and show "Add another" button
        setShowInput(false)
    }, [inputValue, values, onChange, validateFn, normalizeFn, validationMessage])

    const handleRemove = useCallback((index: number) => {
        const newValues = values.filter((_, i) => i !== index)
        onChange(newValues)
        if (newValues.length === 0) {
            setShowInput(true)
        }
    }, [values, onChange])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleAdd()
        }
    }, [handleAdd])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        // Clear error when user starts typing again
        if (error) setError(null)
    }, [error])

    const canAddMore = values.length < maxItems && !disabled

    return (
        <div className={cn("space-y-2", className)}>
            {/* Existing values as badges */}
            {values.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {values.map((value, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="h-7 px-2 gap-1.5 text-sm font-normal bg-muted hover:bg-muted"
                        >
                            {icon && <span className="opacity-60">{icon}</span>}
                            <span className="truncate max-w-[180px]">{value}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="ml-0.5 hover:text-destructive transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Input for new value */}
            {showInput && canAddMore && (
                <div className="space-y-1">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            {icon && (
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                                    {icon}
                                </div>
                            )}
                            <Input
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                disabled={disabled}
                                className={cn(
                                    "h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20",
                                    icon && "pl-10",
                                    error && "border-destructive focus-visible:border-destructive",
                                    inputClassName
                                )}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleAdd}
                            className="h-10 px-3"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    {/* Error message */}
                    {error && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {error}
                        </p>
                    )}
                </div>
            )}

            {/* Add more button - shows after adding at least one value */}
            {!showInput && canAddMore && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setShowInput(true)
                        setError(null)
                    }}
                    className="h-8 text-xs gap-1.5 border-dashed"
                >
                    <Plus className="h-3 w-3" />
                    {addLabel}
                </Button>
            )}

            {/* Max reached hint */}
            {values.length >= maxItems && (
                <p className="text-xs text-muted-foreground">
                    Maximum of {maxItems} values reached
                </p>
            )}
        </div>
    )
}
