export const getEnv = () => {
  // Runtime env (production)
  const runtimeEnv = (window as any).__env__;

  return {
    VITE_API_URL:
      runtimeEnv?.VITE_API_URL || import.meta.env.VITE_API_URL || "",
  };
};
