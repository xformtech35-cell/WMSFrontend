export function useToast() {
  return {
    toast: ({ title, description }) => {
      console.log(title, description);

      if (title) {
        alert(description ? `${title}\n${description}` : title);
      }
    },
  };
}