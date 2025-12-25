'use client'
import Link from 'next/link'
import React from "react";

export default function Nav() {
    return (
        <nav>
            <ul className="flex gap-4 h-2 bg-white">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/tests/payroll/sites">Payroll Site List</Link></li>
            </ul>
        </nav>
    )
}