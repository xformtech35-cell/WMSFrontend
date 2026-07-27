import React from "react";

const ImageGallery = ({ images = [], baseUrl = "" }) => {
  if (!images?.length) {
    return (
      <span className="text-xs text-gray-400">
        No Images
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((img) => (
        <a
          key={img.id}
          href={`${baseUrl}/${img.filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <img
            src={`${baseUrl}/${img.filePath}`}
            alt={img.fileName}
            className="h-12 w-12 rounded-lg border object-cover transition group-hover:scale-105"
          />
        </a>
      ))}
    </div>
  );
};

export default ImageGallery;