import React, { useEffect, useState, Suspense, useRef } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { useUpload, useProcessUpload } from "@/hooks/use-uploads";
import { PointCloudCanvas, PointCloudRef } from "@/components/point-cloud-viewer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Share2, 
  Download, 
  ChevronLeft, 
  Box,
  FileCode,
  Layers,
  Sparkles,
  Target
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Viewer() {
  const { toast } = useToast();
  const canvasRef = useRef<PointCloudRef>(null);
  const [, params] = useRoute("/view/:id");
  const id = parseInt(params?.id || "0");
  const { data: upload, isLoading, error } = useUpload(id);
  const { mutate: processUpload, isPending: isProcessing } = useProcessUpload();
  
  // Viewer controls state
  const [displacement, setDisplacement] = useState([2.0]);
  const [pointSize, setPointSize] = useState([0.05]);
  const [renderMode, setRenderMode] = useState<"point" | "splat">("point");

  useEffect(() => {
    if (upload && upload.status === "pending") {
      processUpload(id);
    }
  }, [upload?.status, id, processUpload]);

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading experience...</p>
        </div>
      </Layout>
    );
  }

  if (error || !upload) {
    return (
      <Layout>
        <div className="h-[80vh] flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Failed to load</h2>
            <p className="text-muted-foreground">The requested visualization could not be found.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isReady = upload.status === "completed" && upload.depthMapUrl;
  const isFailed = upload.status === "failed";
  const isWorking = upload.status === "pending" || upload.status === "processing" || isProcessing;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "The URL has been copied to your clipboard.",
    });
  };

  const handleExportPLY = () => {
    if (canvasRef.current) {
      canvasRef.current.exportPLY();
      toast({
        title: "Exporting PLY",
        description: "Preparing 3D point cloud data with colors...",
      });
    }
  };

  return (
    <Layout>
      <div className="grid lg:grid-cols-[320px_1fr] gap-6 h-[calc(100vh-8rem)]">
        {/* Sidebar Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4 flex flex-col overflow-hidden"
        >
          <div className="space-y-4 p-4 bg-secondary/50 border border-border flex-shrink-0">
            <div>
              <Link href="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-3 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
              <h2 className="text-sm font-mono font-semibold truncate pr-2" title={upload.fileName}>
                {upload.fileName}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 ${
                  isReady ? 'bg-green-500' : 
                  isFailed ? 'bg-red-500' : 
                  'bg-amber-500 animate-pulse'
                }`} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  {upload.status}
                </span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border space-y-4">
              {isReady ? (
                <>
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase text-muted-foreground">Render Mode</span>
                    <Tabs value={renderMode} onValueChange={(v) => setRenderMode(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border border-border">
                        <TabsTrigger value="point" className="gap-2 h-8 text-xs">
                          <Target className="w-3 h-3" /> Point
                        </TabsTrigger>
                        <TabsTrigger value="splat" className="gap-2 h-8 text-xs">
                          <Sparkles className="w-3 h-3" /> Splat
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono uppercase text-muted-foreground">Depth</span>
                      <span className="font-mono text-primary">{displacement[0].toFixed(1)}</span>
                    </div>
                    <Slider
                      value={displacement}
                      onValueChange={setDisplacement}
                      min={0}
                      max={10}
                      step={0.1}
                      className="cursor-pointer h-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono uppercase text-muted-foreground">Scale</span>
                      <span className="font-mono text-primary">{pointSize[0].toFixed(3)}</span>
                    </div>
                    <Slider
                      value={pointSize}
                      onValueChange={setPointSize}
                      min={0.01}
                      max={0.2}
                      step={0.005}
                      className="cursor-pointer h-1"
                    />
                  </div>
                </>
              ) : (
                <div className="py-6 text-center space-y-3">
                  {isFailed ? (
                    <p className="text-xs text-destructive">Processing failed. Please try a different image.</p>
                  ) : (
                    <>
                      <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                      <p className="text-xs text-muted-foreground leading-tight">
                        Processing image<br/>
                        5-10 seconds
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Original Image Preview */}
          <div className="flex-1 min-h-0 p-4 bg-secondary/30 border border-border flex flex-col">
            <h3 className="text-xs font-mono uppercase text-muted-foreground mb-3">Source</h3>
            <div className="relative flex-1 overflow-hidden border border-border bg-black/60">
              <img 
                src={upload.originalUrl} 
                alt="Original" 
                className="absolute inset-0 w-full h-full object-contain" 
                loading="lazy"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              className="flex-1 h-8 text-xs bg-secondary/50 hover:bg-secondary/70 text-foreground border border-border" 
              variant="outline"
              onClick={handleShare}
            >
              <Share2 className="w-3 h-3 mr-1" /> Share
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20">
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-secondary/80 border border-border">
                <DropdownMenuItem onClick={handleExportPLY} className="cursor-pointer gap-2 text-xs">
                  <Layers className="w-3 h-3" /> Export PLY
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2 text-xs text-muted-foreground opacity-50">
                  <FileCode className="w-3 h-3" /> Export OBJ (Soon)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* 3D Canvas Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative h-full flex flex-col"
        >
          {isReady ? (
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-secondary/30 border border-border">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            }>
              <PointCloudCanvas 
                imageUrl={upload.originalUrl}
                depthUrl={upload.depthMapUrl!} 
                displacementScale={displacement[0]}
                pointSize={pointSize[0]}
                renderMode={renderMode}
                canvasRef={canvasRef}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/20 border border-border p-8 text-center space-y-6">
              {isWorking && (
                <div className="relative">
                  <div className="w-20 h-20 border-2 border-muted border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Box className="w-6 h-6 text-primary/60 animate-pulse" />
                  </div>
                </div>
              )}
              
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-semibold">
                  {isFailed ? "Generation Failed" : "Processing"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isFailed 
                    ? "Unable to generate depth map for this image." 
                    : "Analyzing image and generating 3D model..."}
                </p>
              </div>

              {isFailed && (
                <Button onClick={() => window.location.reload()} variant="outline" className="h-8 text-xs border-border">
                  <RefreshCw className="w-3 h-3 mr-1" /> Try Again
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
