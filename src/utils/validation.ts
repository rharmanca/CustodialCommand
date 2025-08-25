export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: string | number | null | undefined): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Invalid file object.' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please use JPEG, PNG, GIF, or WebP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Please use files under 5MB.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File appears to be empty.' };
  }

  return { valid: true };
};

export const validateRatingRange = (rating: number): boolean => {
<<<<<<< HEAD:src/utils/validation.ts
  return rating >= 1 && rating <= 5;
};
=======
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/utils/validation.ts
