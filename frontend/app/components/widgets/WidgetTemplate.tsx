import React from 'react';

export interface WidgetTemplateProps {
    title: string;
    headerContent?: React.ReactNode;
    children: React.ReactNode;
}

export default function WidgetTemplate({ title, headerContent, children }: WidgetTemplateProps) {
    return (
        <div className="panel">
            <div className="panel-heading flex items-center justify-between">
                <span>{title}</span>
                {headerContent && (
                    <div className="flex gap-1">
                        {headerContent}
                    </div>
                )}
            </div>
            <div className="panel-body">
                {children}
            </div>
        </div>
    );
}