'use client'
import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { Plus, MoreHorizontal, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

type Task = {
  id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  progress?: number
}

type Column = {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To-do',
    color: '#00acac',
    tasks: [
      { id: '1', title: 'Enable open search', description: 'Create UI for autocomplete', tags: ['enhancement'], progress: 60 },
      { id: '2', title: 'Investigate adding markdownlint', tags: ['bug'], progress: 0 },
      { id: '3', title: 'Add a "Submit a Resource" form', tags: ['enhancement'], progress: 0 },
      { id: '4', title: 'Custom control border color missing on focus', tags: ['bug'], progress: 0 },
      { id: '5', title: 'New design for corporate page', tags: ['design'], progress: 0 },
    ],
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    color: '#f59c1a',
    tasks: [
      { id: '6', title: 'HTML5 Flexbox old browser compatibility', description: 'Check compatibility for HTML5 flexbox', tags: ['enhancement'], progress: 50 },
      { id: '7', title: 'Mobile app autoclose on iOS', tags: ['bug'], progress: 0 },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    color: '#348fe2',
    tasks: [
      { id: '8', title: 'React version missing daterangepicker', description: 'Install react-daterangepicker', tags: ['feature'], progress: 100 },
    ],
  },
]

export default function ScrumBoardPage() {
  const [columns, setColumns] = useState<Column[]>(initialColumns)

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const sourceColIndex = columns.findIndex(col => col.id === source.droppableId)
    const destColIndex = columns.findIndex(col => col.id === destination.droppableId)

    const sourceCol = columns[sourceColIndex]
    const destCol = columns[destColIndex]

    const sourceTasks = [...sourceCol.tasks]
    const destTasks = source.droppableId === destination.droppableId ? sourceTasks : [...destCol.tasks]

    const [removed] = sourceTasks.splice(source.index, 1)

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, removed)
      const newColumns = [...columns]
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks }
      setColumns(newColumns)
    } else {
      destTasks.splice(destination.index, 0, removed)
      const newColumns = [...columns]
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks }
      newColumns[destColIndex] = { ...destCol, tasks: destTasks }
      setColumns(newColumns)
    }
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'enhancement': return '#00acac'
      case 'bug': return '#ff5b57'
      case 'feature': return '#727cb6'
      case 'design': return '#f59c1a'
      default: return '#929ba1'
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            <span>Home</span> / <span>Extra</span> / <span style={{ color: 'var(--foreground)' }}>Scrum Board</span>
          </div>
          <h1 className="text-xl font-semibold mt-1" style={{ color: 'var(--foreground)' }}>Scrum Board</h1>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--foreground-secondary)' }}>
        <span>project/color-admin</span>
        <span>1,352 pull request</span>
        <span>52 participant</span>
        <span>14 day(s)</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {columns.map((column) => (
            <div key={column.id} className="kanban-column">
              <div
                className="kanban-column-header flex items-center justify-between"
                style={{ borderBottomColor: column.color }}
              >
                <span>{column.title} ({column.tasks.length})</span>
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided: DroppableProvided) => (
                  <div
                    className="kanban-column-body"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="kanban-card"
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {task.progress === 100 ? (
                                  <CheckCircle2 size={14} style={{ color: '#00acac' }} />
                                ) : (
                                  <Circle size={14} style={{ color: 'var(--foreground-muted)' }} />
                                )}
                                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                  {task.title}
                                </span>
                              </div>
                              <button className="p-1 rounded hover:bg-gray-100">
                                <MoreHorizontal size={14} style={{ color: 'var(--foreground-muted)' }} />
                              </button>
                            </div>
                            {task.description && (
                              <p className="text-xs mb-2" style={{ color: 'var(--foreground-muted)' }}>
                                {task.description}
                              </p>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex gap-1 mb-2">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                                    style={{ background: getTagColor(tag) }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {task.progress !== undefined && task.progress > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
                                    Task ({task.progress}%)
                                  </span>
                                </div>
                                <div className="h-1 rounded-full" style={{ background: 'var(--border-color)' }}>
                                  <div
                                    className="h-1 rounded-full"
                                    style={{ width: `${task.progress}%`, background: column.color }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
