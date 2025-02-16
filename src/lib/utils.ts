export const handleError = (error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
    throw new Error(`Error: ${error.message}`);
  } else if (typeof error === "string") {
    console.error(error);
    throw new Error(`Error: ${error}`);
  } else {
    console.error(error);
    throw new Error(`Unknown error: ${JSON.stringify(error)}`);
  }
};

export const resizeBase64Img = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  base64Str: any,
  maxWidth = 100,
  maxHeight = 100,
) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = canvas.getContext("2d") as any;
      ctx.drawImage(img, 0, 0, width, height);

      const newBase64Str = canvas.toDataURL("image/jpeg", 0.7);
      resolve(newBase64Str);
    };
  });
};
