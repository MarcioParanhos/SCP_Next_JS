"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "./dialog"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  confirmVariant?: "default" | "destructive"
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, confirmVariant = "destructive" }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button variant={confirmVariant} onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button>
        </DialogFooter>
        <DialogClose />
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
