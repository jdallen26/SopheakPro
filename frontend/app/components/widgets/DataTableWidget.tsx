import React from 'react';
import WidgetTemplate from './WidgetTemplate';

export interface DataTableWidgetProps {
    title: string;
    headers: string[];
    rows: Record<string, string | number | boolean | React.ReactNode>[];
    footer?: React.ReactNode;
}

export default function DataTableWidget({ title, headers, rows, footer }: DataTableWidgetProps) {
    return (
        <WidgetTemplate title={title}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            {headers.map((header, index) => (
                                <th 
                                    key={index} 
                                    className={`py-2 font-semibold ${index === 0 ? 'text-left' : 'text-right'}`} 
                                    style={{ color: 'var(--foreground)' }}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(!rows || rows.length === 0) ? (
                            <tr>
                                <td colSpan={headers.length} className="py-4 text-center text-gray-500">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, rowIndex) => (
                                <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {Object.values(row).map((cell, cellIndex) => (
                                        <td 
                                            key={cellIndex} 
                                            className={`py-2 ${cellIndex === 0 ? 'text-left' : 'text-right'}`} 
                                            style={{ color: cellIndex === 0 ? 'var(--foreground-secondary)' : 'var(--foreground)' }}
                                        >
                                            {React.isValidElement(cell) ? cell : String(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {footer && (
                <div className="mt-4 pt-2 border-t border-gray-100">
                    {footer}
                </div>
            )}
        </WidgetTemplate>
    );
}