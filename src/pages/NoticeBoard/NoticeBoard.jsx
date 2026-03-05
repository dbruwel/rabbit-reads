import { useState } from 'react';
import './NoticeBoard.css';

const NoticeBoard = () => {
  const [notices] = useState([
    {
      id: 1,
      title: "Welcome New Members!",
      content: "A warm welcome to everyone who joined us this month! Don't forget to introduce yourself in our next meeting.",
      author: "Book Club Admin",
      date: "March 3, 2026",
      pinned: true,
      type: "announcement",
    },
    {
      id: 2,
      title: "Reading Challenge 2026",
      content: "Our annual reading challenge has begun! This year's goal is 24 books. Track your progress and share your achievements with the club.",
      author: "Sarah M.",
      date: "March 1, 2026",
      pinned: true,
      type: "challenge",
    },
    {
      id: 3,
      title: "Guest Author Event - Save the Date!",
      content: "We're thrilled to announce that we'll be hosting a virtual Q&A session with a bestselling author on March 28th. More details coming soon!",
      author: "Book Club Admin",
      date: "February 28, 2026",
      pinned: false,
      type: "event",
    },
    {
      id: 4,
      title: "Book Swap Corner",
      content: "Anyone interested in swapping physical books? I have copies of 'The Night Circus' and 'Circe' available. DM me if interested!",
      author: "Mike T.",
      date: "February 25, 2026",
      pinned: false,
      type: "discussion",
    },
    {
      id: 5,
      title: "Meeting Location Change",
      content: "Next Saturday's meeting will be held at the Downtown Library instead of the usual location. Same time, different place!",
      author: "Book Club Admin",
      date: "February 20, 2026",
      pinned: false,
      type: "announcement",
    },
    {
      id: 6,
      title: "Book Recommendations Thread",
      content: "Looking for mystery/thriller recommendations! I've already read Agatha Christie and want something modern. Any suggestions?",
      author: "Emma K.",
      date: "February 18, 2026",
      pinned: false,
      type: "discussion",
    },
  ]);

  const getTypeIcon = (type) => {
    const icons = {
      announcement: '📢',
      challenge: '🏆',
      event: '🎉',
      discussion: '💬',
    };
    return icons[type] || '📌';
  };

  const pinnedNotices = notices.filter(n => n.pinned);
  const regularNotices = notices.filter(n => !n.pinned);

  return (
    <div className="noticeboard">
      <header className="page-header">
        <h2>📌 Notice Board</h2>
        <p>Stay updated with announcements and discussions!</p>
      </header>

      {pinnedNotices.length > 0 && (
        <section className="pinned-section">
          <h3>📍 Pinned</h3>
          <div className="notices-grid">
            {pinnedNotices.map((notice) => (
              <article key={notice.id} className={`notice-card pinned ${notice.type}`}>
                <div className="notice-icon">{getTypeIcon(notice.type)}</div>
                <div className="notice-content">
                  <h4>{notice.title}</h4>
                  <p>{notice.content}</p>
                  <div className="notice-meta">
                    <span className="notice-author">{notice.author}</span>
                    <span className="notice-date">{notice.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="notices-section">
        <h3>Recent Posts</h3>
        <div className="notices-grid">
          {regularNotices.map((notice) => (
            <article key={notice.id} className={`notice-card ${notice.type}`}>
              <div className="notice-icon">{getTypeIcon(notice.type)}</div>
              <div className="notice-content">
                <h4>{notice.title}</h4>
                <p>{notice.content}</p>
                <div className="notice-meta">
                  <span className="notice-author">{notice.author}</span>
                  <span className="notice-date">{notice.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="quick-post-section">
        <h3>Share Something</h3>
        <div className="quick-post-form">
          <input type="text" placeholder="Title" className="post-title-input" />
          <textarea placeholder="What would you like to share with the club?" className="post-content-input" rows={4} />
          <button className="post-btn">Post to Notice Board</button>
        </div>
      </section>
    </div>
  );
};

export default NoticeBoard;
