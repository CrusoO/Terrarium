import { useState, useCallback } from 'react';

let nextId = 1;

export default function useGallery() {
  const [images, setImages] = useState([]);

  /**
   * Add one or more File objects to the gallery.
   * Creates object URLs for preview; these are revoked on removal.
   */
  const addImages = useCallback((files) => {
    const newImages = files.map((file) => ({
      id: nextId++,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
    }));

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  /**
   * Remove a single image by id and revoke its object URL.
   */
  const removeImage = useCallback((id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  /**
   * Remove all images and revoke all object URLs.
   */
  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.url));
      return [];
    });
  }, []);

  return { images, addImages, removeImage, clearAll };
}
