import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  // Note: on évite console.error ici (générerait du bruit dans error_logs
  // pour des routes legacy / crawlers / requêtes asset). Les redirections
  // legacy connues sont gérées en amont dans App.tsx.
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn("[404] Route inconnue:", location.pathname);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page introuvable</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
