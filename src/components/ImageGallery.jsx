// components/ImageGallery.jsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, ZoomIn } from "lucide-react";
import api from "@/lib/api";

const ImageGallery = ({ images = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const mountedRef = useRef(true);

  // Function to fetch image with authentication
  const fetchImageWithAuth = async (filePath) => {
    // Skip if already loaded or currently loading
    if (imageUrls[filePath] || loadingStates[filePath]) {
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, [filePath]: true }));

      // Use the api instance with authentication
      const response = await api.get(`/images/path?path=${encodeURIComponent(filePath)}`, {
        responseType: 'blob'
      });

      // Create object URL from blob
      const imageUrl = URL.createObjectURL(response.data);
      
      if (mountedRef.current) {
        setImageUrls(prev => ({ ...prev, [filePath]: imageUrl }));
        setLoadingStates(prev => ({ ...prev, [filePath]: false }));
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      if (mountedRef.current) {
        // Set fallback SVG on error
        setImageUrls(prev => ({
          ...prev,
          [filePath]: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E"
        }));
        setLoadingStates(prev => ({ ...prev, [filePath]: false }));
      }
    }
  };

  // Load images when component mounts or images change
  useEffect(() => {
    mountedRef.current = true;

    if (images && images.length > 0) {
      images.forEach(img => {
        if (img.filePath) {
          fetchImageWithAuth(img.filePath);
        }
      });
    }

    // Cleanup object URLs on unmount
    return () => {
      mountedRef.current = false;
      Object.values(imageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

  // If no images, show placeholder
  if (!images || !images.length) {
    return <span className="text-xs text-gray-400">No Images</span>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {images.map((img, index) => {
          const imageUrl = imageUrls[img.filePath];
          const isLoading = loadingStates[img.filePath];

          return (
            <div
              key={img.id || index}
              className="relative group cursor-pointer"
              onClick={() => {
                if (imageUrl && !imageUrl.includes('svg')) {
                  setSelectedImage(img);
                }
              }}
            >
              {isLoading ? (
                // Loading state
                <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-100 animate-pulse flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : imageUrl ? (
                // Image loaded
                <img
                  src={imageUrl}
                  alt={img.fileName || "Image"}
                  className="h-12 w-12 rounded-lg border border-gray-200 object-cover transition-all duration-200 group-hover:scale-105 group-hover:shadow-md group-hover:border-emerald-400"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                  }}
                />
              ) : (
                // Error state
                <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Error</span>
                </div>
              )}

              {/* Hover overlay */}
              {imageUrl && !imageUrl.includes('svg') && (
                <div className="absolute inset-0 group-hover:bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              )}

             
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
              aria-label="Close image"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image */}
            <img
              src={imageUrls[selectedImage.filePath]}
              alt={selectedImage.fileName || "Image"}
              className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                e.target.className = "max-w-full max-h-[85vh] rounded-lg object-contain bg-gray-800 p-8";
              }}
            />

            {/* Image info */}
            {selectedImage.fileName && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <p className="text-white text-sm bg-black bg-opacity-60 px-4 py-2 rounded-full backdrop-blur-sm">
                  {selectedImage.fileName}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default ImageGallery;