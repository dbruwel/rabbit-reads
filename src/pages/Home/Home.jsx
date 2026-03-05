import './Home.css';

const Home = () => {
  const currentBook = {
    title: "The Midnight Library",
    author: "Matt Haig",
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    meetingDate: "March 15, 2026",
    meetingTime: "7:00 PM",
  };

  const recentActivity = [
    { id: 1, text: "New book nomination: 'Project Hail Mary' by Andy Weir", time: "2 hours ago" },
    { id: 2, text: "Voting ends in 3 days for next month's book", time: "5 hours ago" },
    { id: 3, text: "Meeting reminder: This Saturday at 7 PM", time: "1 day ago" },
  ];

  return (
    <div className="home">
      <section className="welcome-section">
        <h2>Welcome to the Book Club! 📖</h2>
        <p>Discover, discuss, and dive into amazing stories together.</p>
      </section>

      <div className="home-grid">
        <section className="current-book-section">
          <h3>Currently Reading</h3>
          <div className="current-book">
            <img
              src={currentBook.coverUrl}
              alt={currentBook.title}
              className="book-cover"
            />
            <div className="book-info">
              <h4>{currentBook.title}</h4>
              <p className="author">by {currentBook.author}</p>
              <p className="description">{currentBook.description}</p>
              <div className="meeting-info">
                <span className="meeting-label">Next Discussion:</span>
                <span className="meeting-date">{currentBook.meetingDate} at {currentBook.meetingTime}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="activity-section">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="activity-item">
                <p>{activity.text}</p>
                <span className="activity-time">{activity.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="quick-links-section">
          <h3>Quick Actions</h3>
          <div className="quick-links">
            <a href="/nominations" className="quick-link">
              <span className="quick-link-icon">📝</span>
              <span>Nominate a Book</span>
            </a>
            <a href="/voting" className="quick-link">
              <span className="quick-link-icon">🗳️</span>
              <span>Vote Now</span>
            </a>
            <a href="/calendar" className="quick-link">
              <span className="quick-link-icon">📅</span>
              <span>View Calendar</span>
            </a>
            <a href="/noticeboard" className="quick-link">
              <span className="quick-link-icon">📌</span>
              <span>Notice Board</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
