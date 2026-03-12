import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import multer from "multer";
import path from "path";
import express from "express";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "image-point-cloud" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file!.buffer);
    });

    const uploadRecord = await storage.createUpload({
      fileName: result.public_id,
      originalUrl: result.secure_url,
    });

    processImage(uploadRecord.id, result.secure_url).catch(console.error);
    res.status(201).json(uploadRecord);
  });

  return httpServer;
}

// Background processing function
async function processImage(uploadId: number, imagePath: string) {
  try {
    await storage.updateUpload(uploadId, { status: "processing" });

    const { pipeline: transformerPipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;

    const depthEstimator = await transformerPipeline('depth-estimation', 'Xenova/depth-anything-small-hf');
    const output = await depthEstimator(imagePath);

    // @ts-ignore
    const depthImage = output.depth;

    // Upload depth map to Cloudinary
    const depthBuffer = await depthImage.toBuffer();
    const depthResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "image-point-cloud" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(depthBuffer);
    });

    await storage.updateUpload(uploadId, {
      status: "completed",
      depthMapUrl: depthResult.secure_url,
    });

  } catch (error) {
    console.error("Depth estimation failed:", error);
    await storage.updateUpload(uploadId, { status: "failed" });
  }
}
