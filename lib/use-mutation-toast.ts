import { useMutation } from "convex/react";
import { toast } from "sonner";
import { FunctionReference } from "convex/server";

/**
 * Wraps a Convex mutation to show a Sonner loading toast while it runs.
 * On success the toast is dismissed. On error it shows an error toast.
 *
 * @param mutationFn - The Convex mutation function reference
 * @param options   - Optional messages and callbacks
 */
export function useMutationWithToast<
  Mutation extends FunctionReference<"mutation">,
>(
  mutationFn: Mutation,
  options: {
    loading?: string;
    success?: string;
    error?: string;
  } = {}
) {
  const mutation = useMutation(mutationFn);
  const {
    loading = "Saving…",
    success,
    error = "Something went wrong",
  } = options;

  const mutateAsync = async (args?: Parameters<typeof mutation>[0]) => {
    const toastId = toast.loading(loading);
    try {
      const result = await mutation(args as Parameters<typeof mutation>[0]);
      if (success) {
        toast.success(success, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : error;
      toast.error(message, { id: toastId });
      throw err;
    }
  };

  return mutateAsync;
}
