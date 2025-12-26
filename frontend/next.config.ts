import type {NextConfig} from "next";
import path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';

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
