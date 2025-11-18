# Agenda Component Module

A comprehensive and modular agenda/calendar component for the Vibratto platform. This module provides a complete solution for event management with drag-and-drop functionality, multiple views, and full CRUD operations.

## 📁 File Structure

```
src/components/BandProfile/Agenda/
├── types.ts                    # TypeScript interfaces and types
├── constants.ts               # Configuration, mock data, and constants
├── utils.ts                   # Utility functions for calculations
├── DraggableEvent.tsx         # Draggable event component
├── DroppableTimeSlot.tsx      # Droppable time slot component
├── CreateEventModal.tsx       # Modal for creating new events
├── EventDetailsModal.tsx      # Modal for viewing/editing events
├── AgendaViewProps.tsx        # Main agenda component with props
├── AgendaTabWrapper.tsx       # Simple wrapper for default usage
├── UsageExamples.tsx          # Integration examples
├── index.ts                   # Main export file
└── README.md                  # This documentation
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { AgendaTab } from './components/BandProfile/Agenda';

function MyPage() {
  return (
    <div className="h-screen">
      <AgendaTab />
    </div>
  );
}
```

### Advanced Usage with Props

```tsx
import { AgendaView } from './components/BandProfile/Agenda';
import type { AgendaEvent } from './components/BandProfile/Agenda';

function MyAdvancedPage() {
  const [events, setEvents] = useState<AgendaEvent[]>([]);

  const handleCreateEvent = async (eventData: Partial<AgendaEvent>) => {
    // Your create logic here
    const newEvent = await createEventAPI(eventData);
    setEvents(prev => [...prev, newEvent]);
  };

  const handleUpdateEvent = async (event: AgendaEvent) => {
    // Your update logic here
    await updateEventAPI(event);
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const handleDeleteEvent = async (eventId: number) => {
    // Your delete logic here
    await deleteEventAPI(eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  return (
    <div className="h-screen">
      <AgendaView
        events={events}
        onEventCreate={handleCreateEvent}
        onEventUpdate={handleUpdateEvent}
        onEventDelete={handleDeleteEvent}
        initialDate={new Date()}
        readonly={false}
      />
    </div>
  );
}
```

## 📋 Components

### AgendaView (Main Component)

The primary agenda component with full functionality.

**Props:**
- `events?: AgendaEvent[]` - Array of events to display
- `onEventCreate?: (event: Partial<AgendaEvent>) => void` - Callback for creating events
- `onEventUpdate?: (event: AgendaEvent) => void` - Callback for updating events
- `onEventDelete?: (eventId: number) => void` - Callback for deleting events
- `initialDate?: Date` - Initial date to display (defaults to today)
- `readonly?: boolean` - Whether the agenda is read-only

### AgendaTab (Wrapper)

Simple wrapper component that uses default behavior with mock data.

**Props:**
- Accepts partial `AgendaViewProps` (all optional)

### DraggableEvent

Individual event component that can be dragged to different time slots.

### DroppableTimeSlot

Time slot component that accepts dropped events.

### CreateEventModal

Modal for creating new events with form validation.

### EventDetailsModal

Modal for viewing, editing, and deleting existing events.

## 🔧 Types

### AgendaEvent

```typescript
interface AgendaEvent {
  id: number;
  title: string;
  description?: string;
  date: Date;
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
  location?: string;
  type: "show" | "rehearsal" | "meeting" | "personal";
  status?: "confirmed" | "pending" | "cancelled";
}
```

### Event Types

- **show**: Musical performances, gigs
- **rehearsal**: Band practice sessions
- **meeting**: Business meetings, client consultations
- **personal**: Personal appointments

### Event Status

- **confirmed**: Event is confirmed and finalized
- **pending**: Event is tentative, awaiting confirmation
- **cancelled**: Event has been cancelled

## 🛠 Utilities

### Event Calculations

```typescript
import { getEventHeight, getEventTopPosition } from './components/BandProfile/Agenda';

const height = getEventHeight(event); // Returns pixel height based on duration
const position = getEventTopPosition(event); // Returns pixel position from top
```

### Event Filtering

```typescript
import { getEventsForDay, filterEventsByType } from './components/BandProfile/Agenda';

const dayEvents = getEventsForDay(allEvents, selectedDate, "show");
const showEvents = filterEventsByType(allEvents, "show");
```

## 🎨 Styling

The component uses Tailwind CSS classes and follows the design system patterns established in the project. Color schemes are defined in the `eventTypeConfig` object:

- **Shows**: Blue theme
- **Rehearsals**: Emerald theme
- **Meetings**: Purple theme
- **Personal**: Gray theme

## 📱 Features

### ✅ Implemented

- **Weekly Calendar View**: 7-day grid with hourly time slots
- **Drag & Drop**: Move events between time slots
- **Event CRUD**: Create, read, update, delete operations
- **Event Types**: Color-coded event categories
- **Event Status**: Confirmed, pending, cancelled states
- **Time Navigation**: Week navigation controls
- **Filter by Type**: Show/hide events by category
- **Current Time Indicator**: Real-time position marker
- **Responsive Design**: Works on different screen sizes
- **Modal Interfaces**: Clean creation and editing dialogs
- **Form Validation**: Input validation for event forms
- **Accessibility**: Keyboard navigation and screen reader support

### 🔄 Possible Enhancements

- **Month View**: Alternative calendar layout
- **Day View**: Single day detailed view
- **Recurring Events**: Support for repeating events
- **Event Conflicts**: Detection and highlighting of overlapping events
- **Export/Import**: iCal, Google Calendar integration
- **Search**: Text search through events
- **Notifications**: Event reminders and alerts
- **Collaborative Features**: Multi-user event sharing
- **Mobile Gestures**: Touch gestures for mobile devices
- **Offline Support**: Local storage and sync capabilities

## 🔗 Integration Examples

See `UsageExamples.tsx` for detailed integration patterns:

1. **Basic Usage**: Simple plug-and-play setup
2. **Backend Integration**: Connected to REST API
3. **Read-only Mode**: Public agenda display
4. **Custom Initial Date**: Starting from specific date
5. **State Management**: Integration with Redux/Zustand

## 🚨 Important Notes

### Dependencies

- `@dnd-kit/core`: For drag and drop functionality
- `date-fns`: For date manipulation and formatting
- `lucide-react`: For icons
- `react`: Core React library

### Performance Considerations

- Events are filtered on each render - consider memoization for large datasets
- Drag operations create temporary overlays - monitor for memory leaks
- Date calculations are performed in real-time - cache when possible

### Browser Support

- Modern browsers with ES2015+ support
- Drag & Drop API support required
- CSS Grid support required

## 🤝 Contributing

When modifying this module:

1. Update types in `types.ts` for any interface changes
2. Add utility functions to `utils.ts` for reusable logic
3. Update constants in `constants.ts` for configuration changes
4. Create examples in `UsageExamples.tsx` for new features
5. Update this README.md with new documentation

## 📝 Migration from Monolithic Component

If migrating from the original large component file:

1. Import the new modular components
2. Replace `AgendaRedesigned` with `AgendaView` or `AgendaTab`
3. Update prop interfaces to use the new types
4. Leverage the utility functions for calculations
5. Use the constants for configuration instead of hardcoded values
