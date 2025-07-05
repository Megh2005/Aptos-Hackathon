import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "res.cloudinary.com",
      "images.unsplash.com",
      "cdn.pixabay.com",
      "media.istockphoto.com",
      "img.freepik.com",
      "lh3.googleusercontent.com",
    ],
  },
};

export default nextConfig;
