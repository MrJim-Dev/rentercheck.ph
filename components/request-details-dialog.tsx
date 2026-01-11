'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText } from 'lucide-react'

export function RequestDetailsDialog() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [bookingValue, setBookingValue] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSubmit = () => {
    // TODO: Implement detail request submission
    console.log('Requesting details:', { reason, bookingValue, acceptedTerms })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Request details
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Request incident details</DialogTitle>
          <DialogDescription>
            Access to detailed information requires verification of your legitimate business interest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reason">Reason for request *</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-md"
            >
              <option value="">Select a reason</option>
              <option value="active-booking">I have an active booking with this person</option>
              <option value="pending-booking">I have a pending booking inquiry</option>
              <option value="past-incident">I had a similar incident</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bookingValue">Current booking value (optional)</Label>
            <Input
              id="bookingValue"
              type="text"
              placeholder="e.g., ₱5,000 - ₱10,000"
              value={bookingValue}
              onChange={(e) => setBookingValue(e.target.value)}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-sm">Terms of use</h4>
            <ul className="text-sm text-gray-700 space-y-1 mb-3 list-disc list-inside">
              <li>Do not repost this information publicly</li>
              <li>Do not use for doxxing or harassment</li>
              <li>Use only for legitimate business screening</li>
              <li>This request will be logged and audited</li>
            </ul>
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                I accept the terms and will use this information responsibly
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason || !acceptedTerms}
          >
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
