/**
 * Image compression utility for avatar uploads
 * Resizes and compresses images to optimize storage and loading
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 200,
  maxHeight: 200,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Compresses an image file for avatar upload
 * @param file - The original image file
 * @param options - Compression options
 * @returns Promise<Blob> - The compressed image blob
 */
export const compressImage = (
  file: File, 
  options: CompressionOptions = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image must be smaller than 5MB'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width, 
          img.height, 
          opts.maxWidth!, 
          opts.maxHeight!
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx!.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${opts.format}`,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate new dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Calculate scaling factor
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  // Only scale down, never up
  if (ratio < 1) {
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
};

/**
 * Generate a unique filename for avatar upload
 * @param userId - User ID
 * @param originalName - Original filename
 * @returns string - Unique filename
 */
export const generateAvatarFilename = (userId: string, originalName: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `avatars/${userId}_${timestamp}.${extension}`;
};

/**
 * Validate image file for avatar upload
 * @param file - File to validate
 * @returns boolean - Whether file is valid
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Image must be smaller than 5MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, WebP, GIF' };
  }

  return { valid: true };
};
