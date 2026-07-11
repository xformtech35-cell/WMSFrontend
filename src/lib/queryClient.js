import { QueryClient } from '@tanstack/react-query';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 60 seconds — reduce refetch churn across modules
            gcTime: 10 * 60 * 1000, // 10 minutes — keep cache warm longer for route switching
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
        },
    },
});
export default queryClient;
