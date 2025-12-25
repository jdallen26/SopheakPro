'use client'
import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus } from 'lucide-react'

const initialEvents = [
  { id: '1', title: 'Team Meeting', start: new Date().toISOString().split('T')[0], backgroundColor: '#00acac', borderColor: '#00acac' },
  { id: '2', title: 'Client Call', start: new Date(Date.now() + 86400000).toISOString().split('T')[0], backgroundColor: '#348fe2', borderColor: '#348fe2' },
  { id: '3', title: 'Project Deadline', start: new Date(Date.now() + 172800000).toISOString().split('T')[0], backgroundColor: '#ff5b57', borderColor: '#ff5b57' },
  { id: '4', title: 'Site Inspection', start: new Date(Date.now() + 259200000).toISOString().split('T')[0], backgroundColor: '#f59c1a', borderColor: '#f59c1a' },
]

export default function CalendarPage() {
  const [events, setEvents] = useState(initialEvents)

  const handleDateClick = (arg: { dateStr: string }) => {
    const title = prompt('Enter event title:')
    if (title) {
      setEvents([
        ...events,
        {
          id: String(Date.now()),
          title,
          start: arg.dateStr,
          backgroundColor: '#00acac',
          borderColor: '#00acac',
        },
      ])
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Calendar</h1>
          <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Manage your schedule</span>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Event
        </button>
      </div>

      <div className="panel">
        <div className="panel-body">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="auto"
            eventDisplay="block"
          />
        </div>
      </div>

      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .fc .fc-button {
          background: var(--teal);
          border-color: var(--teal);
          padding: 6px 12px;
          font-size: 13px;
        }
        .fc .fc-button:hover {
          background: var(--teal-dark);
          border-color: var(--teal-dark);
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background: var(--teal-dark);
          border-color: var(--teal-dark);
        }
        .fc .fc-day-today {
          background: var(--active-bg) !important;
        }
        .fc .fc-daygrid-day-number {
          color: var(--foreground);
          padding: 8px;
        }
        .fc .fc-col-header-cell-cushion {
          color: var(--foreground);
          font-weight: 600;
          padding: 10px;
        }
        .fc .fc-daygrid-day-frame {
          min-height: 100px;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--border-color);
        }
        .fc-theme-standard .fc-scrollgrid {
          border-color: var(--border-color);
        }
      `}</style>
    </div>
  )
}
