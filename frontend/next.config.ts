import type {NextConfig} from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {source: '/payroll/:path*', destination: `${API_BASE}/payroll/:path*`},
        ]
    },
    turbopack: {},
};

export default nextConfig;
