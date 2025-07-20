# Image Cropping Feature

## Overview
This feature adds image cropping functionality to the admin product management system, allowing administrators to crop product images before uploading them.

## Features

### 1. Image Cropping Component (`ImageCropper.jsx`)
- **Reusable cropper component** using `react-easy-crop`
- **Aspect ratio control** (default 1:1 for square images)
- **Zoom functionality** with slider control (1x to 3x)
- **Drag to move** crop area
- **Grid overlay** for precise cropping
- **Responsive design** for mobile devices

### 2. Image Utilities (`imageUtils.js`)
- **`getCroppedImg()`** - Converts cropped area to a new image file
- **`validateImageFile()`** - Validates file type and size
- **`resizeImage()`** - Resizes images before upload
- **`createPreviewUrl()`** - Creates preview URLs for images
- **`revokePreviewUrl()`** - Prevents memory leaks by revoking URLs

### 3. Integration Points

#### AddProductModal
- **Product-level images**: Crop functionality for main product images
- **Variant images**: Individual cropping for each variant's images
- **Crop buttons**: Yellow crop icons on image previews
- **Validation**: File type and size validation before cropping

#### AddVariantModal
- **Variant images**: Crop functionality for new variant images
- **Same interface**: Consistent cropping experience across modals

#### AdminProductForm
- **New image uploads**: Cropping for newly uploaded images
- **Existing images**: Informational message for existing images

#### AdminProductDetails
- **New image uploads**: Cropping for newly uploaded images
- **Existing images**: Informational message for existing images

## Usage

### For Administrators

1. **Adding Product Images**:
   - Select images using the file input
   - Click the yellow crop icon (✂️) on any image preview
   - Adjust the crop area by dragging and zooming
   - Click "Crop & Save" to apply the crop

2. **Adding Variant Images**:
   - Select images for the variant
   - Click the crop icon on any image preview
   - Crop the image as needed
   - Save the cropped image

3. **Image Requirements**:
   - **File types**: JPEG, PNG, WebP
   - **File size**: Maximum 5MB per image
   - **Minimum images**: 3 images per product/variant
   - **Maximum images**: 10 images per product/variant

### Technical Details

#### Dependencies
- `react-easy-crop`: ^5.5.0 (already installed)
- Canvas API: For image processing
- File API: For file handling

#### Browser Support
- Modern browsers with Canvas support
- Mobile browsers with touch support

#### Performance
- Images are processed client-side
- Memory management with URL revocation
- Optimized for large images

## File Structure

```
frontend/src/
├── components/
│   ├── ImageCropper.jsx          # Main cropping component
│   ├── ImageCropper.css          # Cropping styles
│   ├── AddProductModal.jsx       # Updated with cropping
│   └── AddVariantModal.jsx       # Updated with cropping
├── pages/admin/
│   ├── AdminProductForm.jsx      # Updated with cropping
│   └── AdminProductDetails.jsx   # Updated with cropping
└── utils/
    └── imageUtils.js             # Image processing utilities
```

## Error Handling

- **Invalid file types**: Shows error message
- **File too large**: Shows error message
- **Crop failure**: Shows error message with retry option
- **Memory management**: Automatic cleanup of preview URLs

## Future Enhancements

1. **Multiple aspect ratios**: Allow different crop ratios
2. **Batch cropping**: Crop multiple images at once
3. **Preset crops**: Common crop sizes (square, 16:9, etc.)
4. **Image filters**: Basic filters before cropping
5. **Undo/Redo**: Crop history management

## Testing

To test the cropping functionality:

1. Navigate to Admin → Products → Add Product
2. Select images for the product
3. Click the crop icon on any image
4. Adjust the crop area and zoom
5. Save the cropped image
6. Verify the cropped image appears in the preview

## Troubleshooting

### Common Issues

1. **Crop not working**: Check browser console for errors
2. **Images not loading**: Verify file format and size
3. **Memory issues**: Ensure URLs are being revoked properly
4. **Mobile issues**: Test touch interactions on mobile devices

### Debug Mode

Enable debug logging by adding `console.log` statements in the cropping functions to track the cropping process. 