import { useState, useEffect, useCallback } from 'react';
import './BookClub.css';

// ===========================================
// CONFIGURATION - JSONBin.io backend
// ===========================================
const BIN_ID = '69a9071cd0ea881f40f05ffe';
const API_KEY = '$2a$10$.C0VMtbgczOBf1t/Kbn8WeWJ3G6dp46XxqVVitI42AaTVkwN3iM1q';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Fixed members
const MEMBERS = ['Angela', 'Ashton', 'Daniel', 'Gen', 'Jackson', 'Katie', 'Mani', 'Max', 'Sean', 'Wayne'];

// Initial empty state for the data store
const INITIAL_DATA = {
  isVotingOpen: false,
  nominations: [],
  votes: [],
  currentBook: null,
  history: [],
};

const BookClub = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('rabbitReadersAuth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [nominations, setNominations] = useState([]); // { id, member, title, author }
  const [votes, setVotes] = useState([]); // { member, scores: { nominationId: score } }
  const [currentBook, setCurrentBook] = useState(null); // The winner / current read
  const [history, setHistory] = useState([]); // { title, author, member, averageScore, completedDate }
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('rabbitReadersDarkMode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // SHA-256 hash of the password (pre-computed)
  // To generate a new hash, run in browser console:
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword')).then(h => console.log(Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')))
  const PASSWORD_HASH = 'da79aba81047c9527ac6df63a89aa9d709d93ecefe853598e3b127718e4a83d0';

  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const inputHash = await hashPassword(passwordInput);
    if (inputHash === PASSWORD_HASH) {
      localStorage.setItem('rabbitReadersAuth', 'true');
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };



  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('rabbitReadersDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Save data to the JSON store
  const saveData = useCallback(async (data) => {
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY,
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to save data:', err);
      setError('Failed to save data. Changes may not persist.');
    }
  }, []);

  // Load data from the JSON store
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/latest`, {
        headers: {
          'X-Master-Key': API_KEY,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const json = await response.json();
      const data = json.record; // JSONBin wraps data in "record"

      // If the bin is empty or has no data, initialize it
      if (!data || Object.keys(data).length === 0) {
        await saveData(INITIAL_DATA);
        return;
      }

      setIsVotingOpen(data.isVotingOpen ?? false);
      setNominations(data.nominations ?? []);
      setVotes(data.votes ?? []);
      setCurrentBook(data.currentBook ?? null);
      setHistory(data.history ?? []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please check the API configuration.');
    } finally {
      setIsLoading(false);
    }
  }, [saveData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);



  // Helper to save current state
  const saveCurrentState = useCallback((overrides = {}) => {
    const data = {
      isVotingOpen,
      nominations,
      votes,
      currentBook,
      history,
      ...overrides,
    };
    saveData(data);
  }, [isVotingOpen, nominations, votes, currentBook, history, saveData]);

  // Form state for nomination
  const [nominationForm, setNominationForm] = useState({
    member: '',
    title: '',
    author: '',
  });

  // Form state for voting - member selection and scores for each book
  const [voteForm, setVoteForm] = useState({
    member: '',
    scores: {}, // { nominationId: score }
  });

  // Check who has already nominated
  const membersWhoNominated = nominations.map((n) => n.member);
  const membersWhoCanNominate = MEMBERS.filter((m) => !membersWhoNominated.includes(m));

  // Check who has fully voted (voted for ALL current nominations)
  const hasVotedForAllBooks = (memberVote) => {
    if (!memberVote) return false;
    return nominations.every((nom) => memberVote.scores[nom.id] !== undefined);
  };
  const membersWhoVoted = votes
    .filter((v) => hasVotedForAllBooks(v))
    .map((v) => v.member);
  const membersWhoCanVote = MEMBERS.filter((m) => !membersWhoVoted.includes(m));

  // Handle nomination submission
  const handleNominate = (e) => {
    e.preventDefault();
    if (!nominationForm.member || !nominationForm.title || !nominationForm.author) {
      alert('Please fill in all fields');
      return;
    }

    const newNomination = {
      id: Date.now(),
      member: nominationForm.member,
      title: nominationForm.title,
      author: nominationForm.author,
    };

    const newNominations = [...nominations, newNomination];
    setNominations(newNominations);
    setNominationForm({ member: '', title: '', author: '' });
    saveCurrentState({ nominations: newNominations });
  };

  // Start voting (can happen anytime there's at least one nomination)
  const handleStartVoting = () => {
    if (nominations.length === 0) {
      alert('Need at least one nomination to start voting');
      return;
    }
    setIsVotingOpen(true);
    saveCurrentState({ isVotingOpen: true });
  };

  // Return to nominations phase (to add more nominations)
  const handleReturnToNominations = () => {
    setIsVotingOpen(false);
    saveCurrentState({ isVotingOpen: false });
  };

  // Remove a nomination
  const handleRemoveNomination = (nominationId) => {
    const newNominations = nominations.filter((n) => n.id !== nominationId);
    setNominations(newNominations);
    saveCurrentState({ nominations: newNominations });
  };

  // Remove a vote
  const handleRemoveVote = (memberName) => {
    const newVotes = votes.filter((v) => v.member !== memberName);
    setVotes(newVotes);
    saveCurrentState({ votes: newVotes });
  };

  // Handle score change for a book
  const handleScoreChange = (nominationId, score) => {
    setVoteForm({
      ...voteForm,
      scores: {
        ...voteForm.scores,
        [nominationId]: score,
      },
    });
  };

  // Handle vote submission
  const handleVote = (e) => {
    e.preventDefault();
    if (!voteForm.member) {
      alert('Please select who you are');
      return;
    }

    // Check all books have been scored
    const allScored = nominations.every((nom) => voteForm.scores[nom.id] !== undefined);
    if (!allScored) {
      alert('Please score all books before submitting');
      return;
    }

    // Check if member already has a vote entry (partial vote from before new nominations)
    const existingVoteIndex = votes.findIndex((v) => v.member === voteForm.member);
    let updatedVotes;
    if (existingVoteIndex >= 0) {
      // Merge new scores with existing scores
      updatedVotes = votes.map((v, i) => {
        if (i === existingVoteIndex) {
          return { ...v, scores: { ...v.scores, ...voteForm.scores } };
        }
        return v;
      });
    } else {
      updatedVotes = [...votes, { member: voteForm.member, scores: { ...voteForm.scores } }];
    }
    setVotes(updatedVotes);
    setVoteForm({ member: '', scores: {} });

    // Check if all members have fully voted - if so, determine winner
    const allFullyVoted = MEMBERS.every((member) => {
      const memberVote = updatedVotes.find((v) => v.member === member);
      return memberVote && nominations.every((nom) => memberVote.scores[nom.id] !== undefined);
    });
    if (allFullyVoted) {
      calculateWinner(updatedVotes);
    } else {
      saveCurrentState({ votes: updatedVotes });
    }
  };

  // Calculate winner based on total scores
  const calculateWinner = (allVotes) => {
    const totalScores = {};

    // Sum up all scores for each nomination
    nominations.forEach((nom) => {
      totalScores[nom.id] = 0;
    });

    allVotes.forEach((vote) => {
      Object.entries(vote.scores).forEach(([nominationId, score]) => {
        totalScores[nominationId] = (totalScores[nominationId] || 0) + score;
      });
    });

    // Find the nomination with the highest total score
    let maxScore = -1;
    let winningId = null;
    Object.entries(totalScores).forEach(([id, score]) => {
      if (score > maxScore) {
        maxScore = score;
        winningId = Number(id);
      }
    });

    const winningNomination = nominations.find((n) => n.id === winningId);
    const averageScore = (maxScore / MEMBERS.length).toFixed(1);
    const completedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Add current book to history if there is one
    const newHistory = currentBook
      ? [
        ...history,
        {
          title: currentBook.title,
          author: currentBook.author,
          member: currentBook.member,
          averageScore: currentBook.averageScore,
          completedDate: currentBook.completedDate,
        },
      ]
      : history;

    if (currentBook) {
      setHistory(newHistory);
    }

    const newCurrentBook = {
      ...winningNomination,
      totalScore: maxScore,
      averageScore,
      completedDate,
    };

    setCurrentBook(newCurrentBook);

    // Reset for next cycle
    setNominations([]);
    setVotes([]);
    setIsVotingOpen(false);

    // Save all the new state
    saveCurrentState({
      isVotingOpen: false,
      nominations: [],
      votes: [],
      currentBook: newCurrentBook,
      history: newHistory,
    });
  };

  // Password gate screen
  if (!isAuthenticated) {
    return (
      <div className={`book-club ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="password-gate">
          <div className="password-card">
            <span className="password-icon">🐇</span>
            <h1>Rabbit Readers</h1>
            <p>Enter the password to continue</p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password"
                className={passwordError ? 'error' : ''}
                autoFocus
              />
              {passwordError && <span className="password-error">Incorrect password</span>}
              <button type="submit">Enter</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`book-club ${isDarkMode ? 'dark' : 'light'}`}>
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🐇</span>
          <h1>Rabbit Readers</h1>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Loading State */}
        {isLoading && (
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={loadData} className="retry-btn">Retry</button>
          </div>
        )}

        {/* Main content only shows when not loading */}
        {!isLoading && (
          <>
            {/* Current Book Section */}
            <section className="current-book-section">
              {isVotingOpen ? (
                <div className="voting-open-banner">
                  <span className="banner-icon">🗳️</span>
                  <h2>Voting is Open!</h2>
                  <p>Score each book below (0-10) to decide the next read</p>
                </div>
              ) : currentBook ? (
                <div className="current-book-card">
                  <div className="current-book-label">Currently Reading</div>
                  <h2 className="current-book-title">{currentBook.title}</h2>
                  <p className="current-book-author">by {currentBook.author}</p>
                  <p className="current-book-nominator">Nominated by {currentBook.member}</p>
                  <p className="current-book-score">Average Score: {currentBook.averageScore}/10</p>
                </div>
              ) : (
                <div className="no-book-card">
                  <span className="banner-icon">📖</span>
                  <h2>No Current Book</h2>
                  <p>Submit nominations below to get started!</p>
                </div>
              )}
            </section>

            {/* Nomination / Voting Section */}
            {!isVotingOpen ? (
              <section className="nomination-section">
                <div className="section-header">
                  <h2>📝 Nominations</h2>
                  <p>Nominate a book for the next read</p>
                </div>

                <div className="content-grid">
                  {/* Nomination Form */}
                  <div className="form-card">
                    <h3>Nominate a Book</h3>
                    {membersWhoCanNominate.length > 0 ? (
                      <form onSubmit={handleNominate} className="nomination-form">
                        <div className="form-group">
                          <label htmlFor="member">Who are you?</label>
                          <select
                            id="member"
                            value={nominationForm.member}
                            onChange={(e) => setNominationForm({ ...nominationForm, member: e.target.value })}
                          >
                            <option value="">Select your name...</option>
                            {membersWhoCanNominate.map((member) => (
                              <option key={member} value={member}>
                                {member}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="title">Book Title</label>
                          <input
                            type="text"
                            id="title"
                            value={nominationForm.title}
                            onChange={(e) => setNominationForm({ ...nominationForm, title: e.target.value })}
                            placeholder="Enter book title"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="author">Author</label>
                          <input
                            type="text"
                            id="author"
                            value={nominationForm.author}
                            onChange={(e) => setNominationForm({ ...nominationForm, author: e.target.value })}
                            placeholder="Enter author name"
                          />
                        </div>

                        <button type="submit" className="submit-btn">
                          Submit Nomination
                        </button>
                      </form>
                    ) : (
                      <div className="all-nominated">
                        <p>✓ All members have nominated!</p>
                      </div>
                    )}
                  </div>

                  {/* Nomination Status */}
                  <div className="status-card">
                    <h3>Nominations ({nominations.length})</h3>
                    {nominations.length > 0 ? (
                      <div className="nominations-list">
                        {nominations.map((nomination) => (
                          <div key={nomination.id} className="nomination-item complete">
                            <div className="nomination-info">
                              <span className="book-title">{nomination.title}</span>
                              <span className="book-author">by {nomination.author}</span>
                            </div>
                            <div className="nomination-actions">
                              <span className="nominator">{nomination.member}</span>
                              <button
                                className="remove-btn"
                                onClick={() => handleRemoveNomination(nomination.id)}
                                title="Remove nomination"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-nominations">No nominations yet</p>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="voting-section">
                <div className="section-header">
                  <h2>🗳️ Score the Books</h2>
                  <p>Rate each book from 0-10, highest total wins!</p>
                </div>

                <div className="content-grid">
                  {/* Voting Form */}
                  <div className="form-card">
                    <h3>Your Scores</h3>
                    {membersWhoCanVote.length > 0 ? (
                      <form onSubmit={handleVote} className="vote-form">
                        <div className="form-group">
                          <label htmlFor="voter">Who are you?</label>
                          <select
                            id="voter"
                            value={voteForm.member}
                            onChange={(e) => {
                              const member = e.target.value;
                              // Pre-fill with existing votes if member has partial votes
                              const existingVote = votes.find((v) => v.member === member);
                              setVoteForm({
                                member,
                                scores: existingVote ? { ...existingVote.scores } : {},
                              });
                            }}
                          >
                            <option value="">Select your name...</option>
                            {membersWhoCanVote.map((member) => (
                              <option key={member} value={member}>
                                {member}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="scoring-section">
                          <label>Score each book (0-10):</label>
                          <div className="score-options">
                            {nominations.map((nom) => (
                              <div key={nom.id} className="score-item">
                                <div className="score-book-info">
                                  <span className="score-title">{nom.title}</span>
                                  <span className="score-author">by {nom.author}</span>
                                </div>
                                <div className="score-input-wrapper">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={voteForm.scores[nom.id] ?? ''}
                                    onChange={(e) => handleScoreChange(nom.id, Number(e.target.value))}
                                    className="score-input"
                                    placeholder="0-10"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button type="submit" className="submit-btn">
                          Submit Scores
                        </button>
                      </form>
                    ) : (
                      <div className="all-voted">
                        <p>✓ All votes are in!</p>
                        <p className="calculating">Calculating winner...</p>
                      </div>
                    )}

                    <div className="return-nominations-section">
                      <button onClick={handleReturnToNominations} className="return-nominations-btn">
                        ← Return to Nominations
                      </button>
                    </div>
                  </div>

                  {/* Voting Status */}
                  <div className="status-card">
                    <h3>Votes ({votes.length}/{MEMBERS.length})</h3>
                    <div className="votes-list">
                      {MEMBERS.map((member) => {
                        const hasVoted = membersWhoVoted.includes(member);
                        return (
                          <div key={member} className={`vote-status-item ${hasVoted ? 'complete' : ''}`}>
                            <span className="member-name">{member}</span>
                            <div className="vote-actions">
                              <span className={hasVoted ? 'voted' : 'pending'}>
                                {hasVoted ? '✓ Voted' : 'Waiting...'}
                              </span>
                              {hasVoted && (
                                <button
                                  className="remove-btn"
                                  onClick={() => handleRemoveVote(member)}
                                  title="Remove vote"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* History Section */}
            {history.length > 0 && (
              <section className="history-section">
                <div className="section-header">
                  <h2>📚 Reading History</h2>
                  <p>Books we've read together</p>
                </div>

                <div className="history-list">
                  {[...history].reverse().map((book, index) => (
                    <div key={index} className="history-item">
                      <div className="history-book-info">
                        <span className="history-title">{book.title}</span>
                        <span className="history-author">by {book.author}</span>
                      </div>
                      <div className="history-meta">
                        <span className="history-score">⭐ {book.averageScore}/10</span>
                        <span className="history-date">{book.completedDate}</span>
                        <span className="history-nominator">Nominated by {book.member}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Rules Section */}
            <section className="rules-section">
              <div className="section-header">
                <h2>📜 Rules</h2>
              </div>
              <div className="rules-content">
                <p>
                  Each member may submit <em>one nomination</em> per cycle. When voting opens,
                  members score each nominated book with an integer from <strong>0 to 10</strong>.
                  The book with the highest mean score is selected as the next read.
                  A new book is chosen approximately once per month.
                  To keep things manageable, the upper page bound is <strong>∼300 pages</strong>.
                </p>
              </div>
            </section>

            {/* Start Voting Button - only shown during nominations phase */}
            {!isVotingOpen && nominations.length > 0 && (
              <div className="start-voting-section">
                <button onClick={handleStartVoting} className="start-voting-btn">
                  Start Voting ({nominations.length} nomination{nominations.length !== 1 ? 's' : ''})
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>&copy; 2026 Rabbit Readers</p>
      </footer>
    </div>
  );
};

export default BookClub;
