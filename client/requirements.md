## Packages
three | Core 3D library
@react-three/fiber | React renderer for Three.js
@react-three/drei | Useful helpers for React Three Fiber
framer-motion | Smooth UI animations and transitions
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes

## Notes
The application requires a backend that can process images into depth maps.
The frontend assumes the API returns a `depthMapUrl` after processing.
Three.js will be used to render the point cloud based on the original image and the depth map.
