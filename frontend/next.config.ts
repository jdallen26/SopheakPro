import type {NextConfig} from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://192.168.1.50:3000/api';

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {source: '/payroll/:path*', destination: `${API_BASE}/payroll/:path*`},
        ]
    },
    // Ensure Turbopack uses this frontend folder as the project root
    turbopack: {
        root: './'
    },
};

export default nextConfig;
