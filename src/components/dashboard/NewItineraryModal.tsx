"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FilePlus,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KASHMIR_SAMPLE_TOUR } from "@/lib/constants/sample-tour";

interface NewItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (overrideText?: string, fileToUse?: File) => Promise<void>;
  onCreateBlank: () => Promise<void>;
  isProcessing: boolean;
  errorMsg: string | null;
}

export function NewItineraryModal({
  isOpen,
  onClose,
  onExtract,
  onCreateBlank,
  isProcessing,
  errorMsg,
}: NewItineraryModalProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setFileError(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isPdfOrTxt =
        file.type === "application/pdf" ||
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".pdf");

      if (!isPdfOrTxt) {
        setFileError("Please select a PDF or text file.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setFileError("File size exceeds 10 MB limit.");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File size exceeds 10 MB limit.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleLoadSample = () => {
    setPastedText(KASHMIR_SAMPLE_TOUR);
    setActiveTab("paste");
  };

  const handleSubmit = () => {
    if (activeTab === "upload") {
      if (!selectedFile) return;
      onExtract(undefined, selectedFile);
    } else if (activeTab === "paste") {
      if (!pastedText.trim()) return;
      onExtract(pastedText);
    } else {
      onCreateBlank();
    }
  };

  const isSubmitDisabled =
    isProcessing ||
    (activeTab === "upload" && !selectedFile) ||
    (activeTab === "paste" && !pastedText.trim());

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isProcessing) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New itinerary</DialogTitle>
          <DialogDescription>
            Upload a supplier quote or paste a message. We&apos;ll draft the itinerary for you to review.
          </DialogDescription>
        </DialogHeader>

        {/* Global Error Banner */}
        {(errorMsg || fileError) && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>{errorMsg || fileError}</div>
          </div>
        )}

        {/* Mode Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-1.5 text-xs">
              <UploadCloud className="size-3.5" />
              Upload quote
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5 text-xs">
              <FileText className="size-3.5" />
              Paste text
            </TabsTrigger>
            <TabsTrigger value="blank" className="gap-1.5 text-xs">
              <FilePlus className="size-3.5" />
              Start blank
            </TabsTrigger>
          </TabsList>

          {/* 1. Upload Quote Tab */}
          <TabsContent value="upload" className="pt-4 space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-border bg-muted/30"
                  : "border-border hover:border-muted-foreground/30 bg-muted/10"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                aria-label="Upload supplier quote PDF or text file"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-foreground">
                    <FileCheck className="size-5" />
                  </div>
                  <div className="text-sm font-medium text-foreground truncate max-w-sm mx-auto">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to draft
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                  >
                    <X className="size-3 mr-1" />
                    Remove file
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <UploadCloud className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Drag and drop supplier quote
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      PDF or text (up to 10 MB)
                    </div>
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse files
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 2. Paste Text Tab */}
          <TabsContent value="paste" className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                Paste WhatsApp message or supplier notes
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <Sparkles className="size-3 text-muted-foreground" />
                Load sample quote
              </Button>
            </div>

            <Textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste supplier quote, WhatsApp message, day plans, or hotel details here..."
              aria-label="Pasted supplier itinerary quotation"
              className="font-sans text-xs sm:text-sm bg-background border-border"
            />
          </TabsContent>

          {/* 3. Start Blank Tab */}
          <TabsContent value="blank" className="pt-4 space-y-3">
            <div className="p-6 text-center bg-muted/20 border border-border rounded-lg space-y-2">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <FilePlus className="size-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Start with an empty itinerary
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Initialize an empty proposal. You can manually configure destinations, dates, hotels,
                flights, and pricing in the editor.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Confidentiality Reassurance Line (Mandatory per Section 10) */}
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
          <span>Supplier net rates are never shown to clients.</span>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Drafting proposal...</span>
              </>
            ) : activeTab === "blank" ? (
              <>
                <span>Create blank itinerary</span>
                <ArrowRight className="size-3.5" />
              </>
            ) : (
              <>
                <span>Create itinerary</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
