import * as ImageManipulator from 'expo-image-manipulator';

// Crop image to specific aspect ratio
export const cropToAspectRatio = async (uri, format) => {
  try {
    // Get image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
      format: ImageManipulator.SaveFormat.PNG,
    });

    const { width, height } = imageInfo;
    const currentRatio = width / height;
    const targetRatio = format.aspectRatio;

    let cropWidth, cropHeight, originX, originY;

    if (currentRatio > targetRatio) {
      // Image is wider than needed, crop the sides
      cropHeight = height;
      cropWidth = height * targetRatio;
      originX = (width - cropWidth) / 2;
      originY = 0;
    } else {
      // Image is taller than needed, crop top and bottom
      cropWidth = width;
      cropHeight = width / targetRatio;
      originX = 0;
      originY = (height - cropHeight) / 2;
    }

    // Crop and resize the image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: Math.floor(originX),
            originY: Math.floor(originY),
            width: Math.floor(cropWidth),
            height: Math.floor(cropHeight),
          },
        },
        {
          resize: {
            width: format.width,
            height: format.height,
          },
        },
      ],
      { format: ImageManipulator.SaveFormat.PNG }
    );

    return result.uri;
  } catch (error) {
    console.error('Error cropping image:', error);
    return uri; // Return original if cropping fails
  }
};

// Resize image to specific dimensions
export const resizeImage = async (uri, width, height) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width,
            height,
          },
        },
      ],
      { format: ImageManipulator.SaveFormat.PNG }
    );
    return result.uri;
  } catch (error) {
    console.error('Error resizing image:', error);
    return uri;
  }
};

