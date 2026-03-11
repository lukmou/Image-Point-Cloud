
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { pipeline } from 'stream/promises';

// Configure storage for uploaded files
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storageConfig });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadDir));

  // Get all uploads
  app.get(api.uploads.list.path, async (req, res) => {
    const uploads = await storage.getUploads();
    res.json(uploads);
  });

  // Get single upload
  app.get(api.uploads.get.path, async (req, res) => {
    const upload = await storage.getUpload(Number(req.params.id));
    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }
    res.json(upload);
  });

  // Upload file
  app.post(api.uploads.create.path, upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadRecord = await storage.createUpload({
      fileName: req.file.filename,
      originalUrl: `/uploads/${req.file.filename}`,
    });

    // Automatically trigger processing
    processImage(uploadRecord.id, req.file.path).catch(console.error);

    res.status(201).json(uploadRecord);
  });

  return httpServer;
}

// Background processing function
async function processImage(uploadId: number, imagePath: string) {
  try {
    await storage.updateUpload(uploadId, { status: "processing" });

    // Use Transformers.js for depth estimation
    // Dynamic import because it's an ESM module
    const { pipeline: transformerPipeline, env } = await import('@xenova/transformers');
    
    // Skip local model checks for faster startup in this environment
    env.allowLocalModels = false;
    
    // Initialize the depth estimation pipeline
    // Using a smaller model for speed and memory efficiency
    const depthEstimator = await transformerPipeline('depth-estimation', 'Xenova/depth-anything-small-hf');
    
    // Run inference
    const output = await depthEstimator(imagePath);
    
    // @ts-ignore - Transformers.js output type can be complex
    const depthImage = output.depth;
    
    // Save the depth map
    const filename = path.basename(imagePath, path.extname(imagePath)) + "_depth.png";
    const depthPath = path.join(path.dirname(imagePath), filename);
    
    await depthImage.save(depthPath);

    await storage.updateUpload(uploadId, {
      status: "completed",
      depthMapUrl: `/uploads/${filename}`,
    });
    
  } catch (error) {
    console.error("Depth estimation failed:", error);
    await storage.updateUpload(uploadId, { status: "failed" });
  }
}
