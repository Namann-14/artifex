import { toast } from "sonner"

// Simple toast hook using Sonner
export function useToast() {
  return {
    toast: (props: { title?: string; description?: string }) => {
      if (props.description) {
        return toast(props.title || "Notification", {
          description: props.description,
        })
      }
      return toast(props.title || "Notification")
    },
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    warning: (message: string) => toast.warning(message),
    info: (message: string) => toast.info(message),
  }
}
