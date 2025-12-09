import React, { useState, useEffect, useRef } from 'react';

interface ProxyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

const ProxyImage: React.FC<ProxyImageProps> = ({ src, alt, className = "", priority = false }) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Lazy Load Observer
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' } 
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Fetch Image Data
  useEffect(() => {
    if (!src || !isVisible) return;
    
    // If it's not our proxy, just use it
    if (!src.includes('image-proxy-viewer.onrender.com')) {
      setImageSrc(src);
      return;
    }

    const controller = new AbortController();
    const fetchImage = async () => {
      try {
        const res = await fetch(src, { signal: controller.signal });
        if (res.ok) {
          const text = await res.text();
          if (text.startsWith('data:image')) {
            setImageSrc(text);
          } else {
            setImageSrc(src);
          }
        }
      } catch (e) {
         // ignore aborts
      }
    };
    
    fetchImage();
    return () => controller.abort();
  }, [src, isVisible]);

  const displaySrc = imageSrc || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // Transparent placeholder

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
         <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center z-0">
           <div className="w-6 h-6 border-2 border-gray-600 rounded-full border-t-transparent animate-spin"></div>
         </div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} relative z-10`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};

export default ProxyImage;