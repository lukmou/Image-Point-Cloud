import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useUploads } from "@/hooks/use-uploads";
import { Loader2, Box, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Gallery() {
  const { data: uploads, isLoading } = useUploads();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold font-display mb-2">Community Gallery</h1>
            <p className="text-muted-foreground">Explore 3D conversions created by others.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : !uploads?.length ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Box className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No uploads yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to create a 3D world from an image.</p>
            <Link href="/">
              <span className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 cursor-pointer">
                Create Now
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploads.map((upload, i) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/view/${upload.id}`}>
                  <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-card border border-white/10 cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/10">
                    <img 
                      src={upload.originalUrl} 
                      alt={upload.fileName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <h3 className="font-bold text-white text-lg truncate mb-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {upload.fileName}
                      </h3>
                      <div className="flex items-center justify-between text-white/70 text-xs translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {upload.createdAt ? format(new Date(upload.createdAt), 'MMM d, yyyy') : 'Unknown'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          upload.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {upload.status}
                        </span>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <Box className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
