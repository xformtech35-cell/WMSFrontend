import { toast } from "sonner";


export const downloadImage = (base64Data, filename) => {
    if (!base64Data) {
      toast.error("No image available to download");
      return;
    }

    try {
      // Handle base64 with or without data URL prefix
      let base64String = base64Data;
      if (base64Data.startsWith("data:image")) {
        base64String = base64Data.split(",")[1];
      }

      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // toast.success("Downloaded successfully");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };