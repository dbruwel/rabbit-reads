import { useState } from 'react';
import './Voting.css';

const Voting = () => {
  const [books, setBooks] = useState([
    { id: 1, title: "Project Hail Mary", author: "Andy Weir", votes: 12, hasVoted: false },
    { id: 2, title: "The House in the Cerulean Sea", author: "TJ Klune", votes: 8, hasVoted: false },
    { id: 3, title: "Klara and the Sun", author: "Kazuo Ishiguro", votes: 15, hasVoted: false },
    { id: 4, title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", votes: 10, hasVoted: false },
    { id: 5, title: "Piranesi", author: "Susanna Clarke", votes: 6, hasVoted: false },
  ]);

  const [userVotes, setUserVotes] = useState(3); // User gets 3 votes
  const votingEndsIn = "3 days, 14 hours";

  const handleVote = (bookId) => {
    if (userVotes <= 0) {
      alert("You've used all your votes!");
      return;
    }

    setBooks(prev => prev.map(book => {
      if (book.id === bookId) {
        if (book.hasVoted) {
          return book; // Already voted for this book
        }
        return { ...book, votes: book.votes + 1, hasVoted: true };
      }
      return book;
    }));

    setUserVotes(prev => prev - 1);
  };

  const sortedBooks = [...books].sort((a, b) => b.votes - a.votes);
  const maxVotes = Math.max(...books.map(b => b.votes));

  return (
    <div className="voting">
      <header className="page-header">
        <h2>🗳️ Vote for Next Month's Book</h2>
        <p>Cast your votes for the books you want to read!</p>
      </header>

      <div className="voting-info">
        <div className="voting-stat">
          <span className="stat-label">Voting Ends In</span>
          <span className="stat-value">{votingEndsIn}</span>
        </div>
        <div className="voting-stat">
          <span className="stat-label">Your Remaining Votes</span>
          <span className="stat-value votes-remaining">{userVotes}</span>
        </div>
      </div>

      <div className="voting-content">
        <section className="voting-cards">
          <h3>Cast Your Votes</h3>
          <div className="books-grid">
            {books.map((book) => (
              <div key={book.id} className={`book-vote-card ${book.hasVoted ? 'voted' : ''}`}>
                <div className="book-details">
                  <h4>{book.title}</h4>
                  <p className="author">by {book.author}</p>
                </div>
                <div className="vote-count">
                  <span className="count">{book.votes}</span>
                  <span className="label">votes</span>
                </div>
                <button
                  className={`vote-btn ${book.hasVoted ? 'voted' : ''}`}
                  onClick={() => handleVote(book.id)}
                  disabled={book.hasVoted || userVotes <= 0}
                >
                  {book.hasVoted ? '✓ Voted' : 'Vote'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="voting-results">
          <h3>Current Standings</h3>
          <div className="results-list">
            {sortedBooks.map((book, index) => (
              <div key={book.id} className="result-item">
                <span className="rank">#{index + 1}</span>
                <div className="result-details">
                  <span className="result-title">{book.title}</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(book.votes / maxVotes) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="result-votes">{book.votes}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Voting;
