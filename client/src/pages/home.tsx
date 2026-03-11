import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useCreateUpload, useUploads } from "@/hooks/use-uploads";
import { Upload, ImageIcon, Loader2, ArrowRight, Wand2, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "clsx";

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { mutateAsync: uploadImage } = useCreateUpload();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG).",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImage(file);
      setLocation(`/view/${result.id}`);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-12 py-16">
        {/* Hero Section */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-primary">
              DepthCloud
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Convert 2D images to interactive 3D point clouds using AI-powered depth estimation. Import, process, and export in industry-standard formats.
            </p>
          </motion.div>
        </div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              "relative bg-secondary/50 border border-border p-12 md:p-16 text-center transition-all duration-300 flex flex-col items-center justify-center gap-6 min-h-[380px] cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/10" 
                : "hover:border-primary/50 hover:bg-secondary/70"
            )}
          >
            <div className="flex items-center justify-center gap-3">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {isUploading ? "Processing..." : "Import Image"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your image or click to browse
              </p>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={isUploading}
            />
          </div>
        </motion.div>

        {/* Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {[
            {
              icon: ImageIcon,
              title: "Import",
              desc: "Load any image file"
            },
            {
              icon: Wand2,
              title: "Analyze",
              desc: "AI generates depth map"
            },
            {
              icon: Box,
              title: "Export",
              desc: "Download as PLY file"
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="p-4 border border-border bg-secondary/30 space-y-3 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-sm">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}
