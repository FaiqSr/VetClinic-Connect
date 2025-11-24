"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode, useState } from "react";

interface FormDialogProps {
  title: string;
  description: string;
  trigger: ReactNode;
  children: ReactNode;
}

export default function FormDialog({ title, description, trigger, children }: FormDialogProps) {
    const [open, setOpen] = useState(false);

    // We pass this function to the form, so it can close the dialog on submit
    const closeDialog = () => setOpen(false);

    // We need to clone the child (the form) and pass the closeDialog function as a prop
    const formWithProps = children ? React.cloneElement(children as React.ReactElement, { closeDialog }) : null;


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {formWithProps}
      </DialogContent>
    </Dialog>
  );
}
