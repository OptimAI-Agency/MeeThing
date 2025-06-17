
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useBackground } from "@/hooks/useBackground";

const NotFound = () => {
  const location = useLocation();
  const { backgroundUrl } = useBackground();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{
      backgroundImage: `url('${backgroundUrl}')`
    }}>
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4 nature-text-shadow">404</h1>
          <p className="text-xl text-white/90 mb-4 nature-text-shadow">Oops! Page not found</p>
          <a href="/" className="text-white/80 hover:text-white underline nature-text-shadow">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
