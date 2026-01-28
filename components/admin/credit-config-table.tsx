"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { getCreditConfigs, toggleActionStatus, updateActionCost, type CreditActionConfig } from "@/lib/actions/credit-config"
import { AlertCircle, Edit2, Loader2, Save, X } from "lucide-react"
import { useEffect, useState } from "react"

export function CreditConfigTable() {
    const [configs, setConfigs] = useState<CreditActionConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<string>("")
    const [editType, setEditType] = useState<'deduction' | 'addition'>('deduction')
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        loadConfigs()
    }, [])

    const loadConfigs = async () => {
        setLoading(true)
        const result = await getCreditConfigs()
        if (result.success && result.data) {
            setConfigs(result.data)
        } else {
            toast({
                title: "Error",
                description: "Failed to load credit configurations",
                variant: "destructive"
            })
        }
        setLoading(false)
    }

    const startEdit = (config: CreditActionConfig) => {
        setEditingKey(config.action_key)
        setEditValue(config.cost.toString())
        setEditType(config.action_type || 'deduction')
    }

    const cancelEdit = () => {
        setEditingKey(null)
        setEditValue("")
    }

    const saveCost = async (key: string) => {
        const newCost = parseInt(editValue)
        if (isNaN(newCost) || newCost < 0) {
            toast({
                title: "Invalid Cost",
                description: "Cost must be a non-negative number",
                variant: "destructive"
            })
            return
        }

        setSaving(true)
        const result = await updateActionCost(key, newCost, editType)
        if (result.success) {
            toast({
                title: "Success",
                description: "Credit config updated successfully",
            })
            // Update local state
            setConfigs(prev => prev.map(c =>
                c.action_key === key ? { ...c, cost: newCost, action_type: editType } : c
            ))
            setEditingKey(null)
        } else {
            toast({
                title: "Error",
                description: "Failed to update config",
                variant: "destructive"
            })
        }
        setSaving(false)
    }

    const toggleStatus = async (key: string, currentStatus: boolean) => {
        const result = await toggleActionStatus(key, !currentStatus)
        if (result.success) {
            setConfigs(prev => prev.map(c =>
                c.action_key === key ? { ...c, is_active: !currentStatus } : c
            ))
            toast({
                title: !currentStatus ? "Action Enabled" : "Action Disabled",
                description: `Action has been ${!currentStatus ? 'enabled' : 'disabled'}.`
            })
        } else {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Action Costs</CardTitle>
                <CardDescription>
                    Configure how many credits each action costs. Changes apply immediately.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {configs.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No configurable actions found.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Action Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-[100px] text-center">Type</TableHead>
                                        <TableHead className="w-[100px] text-center">Active</TableHead>
                                        <TableHead className="w-[150px] text-right">Cost (Credits)</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {configs.map((config) => (
                                        <TableRow key={config.action_key}>
                                            <TableCell className="font-medium">
                                                {config.action_name}
                                                <div className="text-xs text-muted-foreground font-mono mt-0.5">{config.action_key}</div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {config.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {editingKey === config.action_key ? (
                                                    <select
                                                        value={editType}
                                                        onChange={(e) => setEditType(e.target.value as 'deduction' | 'addition')}
                                                        className="h-8 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    >
                                                        <option value="deduction">Deduct</option>
                                                        <option value="addition">Add</option>
                                                    </select>
                                                ) : (
                                                    <Badge variant="outline" className={config.action_type === 'addition' ? "bg-green-100 text-green-800 border-green-200" : ""}>
                                                        {config.action_type === 'addition' ? 'Add' : 'Deduct'}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={config.is_active}
                                                    onCheckedChange={() => toggleStatus(config.action_key, config.is_active)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingKey === config.action_key ? (
                                                    <Input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="h-8 w-20 ml-auto"
                                                        min="0"
                                                    />
                                                ) : (
                                                    <Badge variant={config.cost === 0 ? "secondary" : "default"} className="font-mono">
                                                        {config.cost}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingKey === config.action_key ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="sm" variant="ghost" onClick={() => saveCost(config.action_key)} disabled={saving} className="h-8 w-8 p-0 text-green-600">
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving} className="h-8 w-8 p-0 text-muted-foreground">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end">
                                                        <Button size="sm" variant="ghost" onClick={() => startEdit(config)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {configs.map((config) => (
                                <div key={config.action_key} className="p-4 border rounded-lg bg-card/50 space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium text-sm">{config.action_name}</h4>
                                            <code className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                                                {config.action_key}
                                            </code>
                                        </div>

                                        {/* Mobile Actions */}
                                        {editingKey === config.action_key ? (
                                            <div className="flex items-center gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => saveCost(config.action_key)} disabled={saving} className="h-8 w-8 p-0 text-green-600">
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving} className="h-8 w-8 p-0 text-muted-foreground">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => startEdit(config)} className="h-8 w-8 p-0 text-muted-foreground">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {config.description || "No description provided."}
                                    </p>

                                    <div className="h-px bg-border/50" />

                                    {/* Controls */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-medium text-muted-foreground">Action Type</span>
                                            {editingKey === config.action_key ? (
                                                <select
                                                    value={editType}
                                                    onChange={(e) => setEditType(e.target.value as 'deduction' | 'addition')}
                                                    className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <option value="deduction">Deduct</option>
                                                    <option value="addition">Add</option>
                                                </select>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className={`w-fit ${config.action_type === 'addition' ? "bg-green-100 text-green-800 border-green-200" : ""}`}
                                                >
                                                    {config.action_type === 'addition' ? 'Add' : 'Deduct'}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5 items-end">
                                            <span className="text-xs font-medium text-muted-foreground">Status</span>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={config.is_active}
                                                    onCheckedChange={() => toggleStatus(config.action_key, config.is_active)}
                                                    className="scale-90"
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {config.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1.5 col-span-2">
                                            <span className="text-xs font-medium text-muted-foreground">Cost (Credits)</span>
                                            {editingKey === config.action_key ? (
                                                <Input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-8"
                                                    min="0"
                                                />
                                            ) : (
                                                <Badge variant={config.cost === 0 ? "secondary" : "default"} className="font-mono w-fit">
                                                    {config.cost}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
