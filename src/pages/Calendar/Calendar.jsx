import { useState } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2)); // March 2026

  const events = [
    { date: '2026-03-07', title: 'Book Club Meeting', type: 'meeting', description: 'Discussion: The Midnight Library' },
    { date: '2026-03-12', title: 'Voting Opens', type: 'voting', description: 'Vote for April book' },
    { date: '2026-03-15', title: 'Voting Closes', type: 'voting', description: 'Last day to vote' },
    { date: '2026-03-21', title: 'Book Club Meeting', type: 'meeting', description: 'Mid-month check-in' },
    { date: '2026-03-28', title: 'Author Q&A', type: 'special', description: 'Virtual event with guest author' },
    { date: '2026-04-04', title: 'Book Club Meeting', type: 'meeting', description: 'April book kickoff' },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();
  };

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="calendar-page">
      <header className="page-header">
        <h2>📅 Calendar</h2>
        <p>Keep track of all book club events and meetings!</p>
      </header>

      <div className="calendar-content">
        <section className="calendar-section">
          <div className="calendar-nav">
            <button onClick={() => navigateMonth(-1)} className="nav-btn">&lt;</button>
            <h3>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
            <button onClick={() => navigateMonth(1)} className="nav-btn">&gt;</button>
          </div>

          <div className="calendar-grid">
            {daysOfWeek.map(day => (
              <div key={day} className="calendar-header-cell">{day}</div>
            ))}
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={index}
                  className={`calendar-cell ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                >
                  {day && (
                    <>
                      <span className="day-number">{day}</span>
                      <div className="day-events">
                        {dayEvents.map((event, i) => (
                          <div key={i} className={`event-dot ${event.type}`} title={event.title} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="event-legend">
            <div className="legend-item">
              <span className="event-dot meeting"></span>
              <span>Meetings</span>
            </div>
            <div className="legend-item">
              <span className="event-dot voting"></span>
              <span>Voting</span>
            </div>
            <div className="legend-item">
              <span className="event-dot special"></span>
              <span>Special Events</span>
            </div>
          </div>
        </section>

        <section className="upcoming-section">
          <h3>Upcoming Events</h3>
          <div className="upcoming-list">
            {upcomingEvents.map((event, index) => (
              <div key={index} className={`upcoming-event ${event.type}`}>
                <div className="event-date">
                  <span className="event-day">{new Date(event.date).getDate()}</span>
                  <span className="event-month">{months[new Date(event.date).getMonth()].slice(0, 3)}</span>
                </div>
                <div className="event-details">
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Calendar;
