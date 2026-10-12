import { useState, useEffect, useCallback } from 'react';
import './BookClub.css';

// ===========================================
// CONFIGURATION - JSONBin.io backend
// ===========================================
const BIN_ID = '69a9071cd0ea881f40f05ffe';
const API_KEY = '$2a$10$LVwkMPQOHnE1Xv.IQSKBaeS4sTndH/mkxwVHeGM5MZ.5XRVvYeB4C';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Fixed members
const MEMBERS = ['Angela', 'Ashton', 'Daniel', 'Jackson', 'Katie', 'Mani', 'Richard', 'Sean', 'Ursula', 'Wayne'];

// Initial empty state for the data store
const INITIAL_DATA = {
  isVotingOpen: false,
  nominations: [],
  votes: [],
  currentBook: null,
  history: [],
  // legacy fields optOutMembers / excludedFromVoting removed; derive from nominations/votes
};

function BookClub() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('rabbitReadersAuth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [nominations, setNominations] = useState([]); // { id, member, title, author }
  const [votes, setVotes] = useState([]); // { member, scores: { nominationId: score }, optedOut }
  const [currentBook, setCurrentBook] = useState(null); // The winner / current read
  const [history, setHistory] = useState([]); // { title, author, member, averageScore, completedDate }
  // Note: opt-out state is derived from `nominations` (null title/author)
  // and `votes` (optedOut flag) instead of separate arrays.
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
          'X-Access-Key': API_KEY,
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
          'X-Access-Key': API_KEY,
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
      // legacy bins may have optOutMembers/excludedFromVoting but we derive
      // opt-out state from `nominations` and `votes` instead
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

  // Pull latest data from server, apply update, and push back (prevents stale data)
  const pullUpdatePush = useCallback(async (updateFn) => {
    try {
      // Pull latest data
      const response = await fetch(`${API_URL}/latest`, {
        headers: {
          'X-Access-Key': API_KEY,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch latest data');
      const json = await response.json();
      const latestData = json.record;

      // Apply update to latest data
      const updatedData = updateFn(latestData);

      // Push updated data
      await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': API_KEY,
        },
        body: JSON.stringify(updatedData),
      });

      // Update local state to match what was pushed
      setIsVotingOpen(updatedData.isVotingOpen ?? false);
      setNominations(updatedData.nominations ?? []);
      setVotes(updatedData.votes ?? []);
      setCurrentBook(updatedData.currentBook ?? null);
      setHistory(updatedData.history ?? []);

      return updatedData;
    } catch (err) {
      console.error('Pull-update-push failed:', err);
      setError('Failed to save data. Please try again.');
      throw err;
    }
  }, []);

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
  const isMemberOptedOutNom = (member) =>
    nominations.some((n) => n.member === member && n.title === null && n.author === null);
  const membersWhoCanNominate = MEMBERS.filter(
    (m) => !membersWhoNominated.includes(m) && !isMemberOptedOutNom(m)
  );

  const activeNominations = nominations.filter((n) => n.title !== null);

  // Check who has fully voted (voted for ALL current nominations)
  const hasVotedForAllBooks = (memberVote) => {
    if (!memberVote) return false;
    // If the member explicitly opted out of voting, treat as 'complete'
    if (memberVote.optedOut) return true;
    const scores = memberVote.scores || {};
    return activeNominations.every((nom) => scores[nom.id] !== undefined);
  };
  const membersWhoVoted = votes
    .filter((v) => hasVotedForAllBooks(v))
    .map((v) => v.member);
  const isMemberExcludedFromVoting = (member) => votes.some((v) => v.member === member && v.optedOut);
  const membersWhoCanVote = MEMBERS.filter(
    (m) => !membersWhoVoted.includes(m) && !isMemberExcludedFromVoting(m)
  );

  useEffect(() => {
    if (!isVotingOpen || activeNominations.length === 0) return;

    const votingMembers = MEMBERS.filter(
      (member) => !votes.some((v) => v.member === member && v.optedOut)
    );

    const allFullyVoted = votingMembers.every((member) => {
      const memberVote = votes.find((v) => v.member === member);
      return memberVote && activeNominations.every((nom) => memberVote.scores?.[nom.id] !== undefined);
    });

    if (allFullyVoted) {
      calculateWinner(votes, nominations);
    }
  }, [votes, nominations, isVotingOpen, activeNominations, calculateWinner]);

  // Handle nomination submission
  const handleNominate = async (e) => {
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

    try {
      await pullUpdatePush((latestData) => ({
        ...latestData,
        nominations: [...(latestData.nominations ?? []), newNomination],
      }));
      setNominationForm({ member: '', title: '', author: '' });
    } catch (err) {
      console.error('Failed to submit nomination:', err);
    }
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

  // Remove a nomination (uses pull-update-push to avoid stale writes)
  const handleRemoveNomination = async (nominationId) => {
    try {
      await pullUpdatePush((latestData) => ({
        ...latestData,
        nominations: (latestData.nominations || []).filter((n) => n.id !== nominationId),
      }));
    } catch (err) {
      console.error('Failed to remove nomination:', err);
    }
  };

  // Remove a vote (use pull-update-push to avoid stale writes)
  const handleRemoveVote = async (memberName) => {
    try {
      await pullUpdatePush((latestData) => ({
        ...latestData,
        votes: (latestData.votes || []).filter((v) => v.member !== memberName),
      }));
    } catch (err) {
      console.error('Failed to remove vote:', err);
    }
  };

  // Toggle opt-out from nominations
  // Toggle opt-out from nominations. When opting out we add a "null" nomination
  // (title/author === null) so the member is recorded as opting out. Uses pull-update-push.
  const handleToggleOptOut = async (memberName) => {
    try {
      await pullUpdatePush((latestData) => {
        const latestNominations = latestData.nominations || [];
        let newNominations = [...latestNominations];
        const hasNullNom = newNominations.some((n) => n.member === memberName && n.title === null && n.author === null);
        if (hasNullNom) {
          // remove the null nomination (opt-in)
          newNominations = newNominations.filter((n) => !(n.member === memberName && n.title === null && n.author === null));
        } else {
          // add a null nomination to record opt-out
          newNominations.push({ id: Date.now(), member: memberName, title: null, author: null });
        }

        return {
          ...latestData,
          nominations: newNominations,
        };
      });
      // clear the nomination form selection
      setNominationForm({ member: '', title: '', author: '' });
    } catch (err) {
      console.error('Failed to toggle opt-out:', err);
    }
  };

  // Toggle exclusion from voting
  // Toggle exclusion from voting. Uses pull-update-push so changes are applied
  // against the latest data. When excluding, we mark the votes entry as optedOut.
  const handleToggleExcludeFromVoting = async (memberName) => {
    try {
      await pullUpdatePush((latestData) => {
        const latestVotes = latestData.votes || [];
        let newVotes = [...latestVotes];
        const existingOpted = newVotes.find((v) => v.member === memberName && v.optedOut);
        if (existingOpted) {
          // remove optedOut marker (include in voting)
          newVotes = newVotes.filter((v) => !(v.member === memberName && v.optedOut));
        } else {
          // remove any previous vote and add optedOut marker
          newVotes = newVotes.filter((v) => v.member !== memberName);
          newVotes.push({ member: memberName, optedOut: true });
        }

        return {
          ...latestData,
          votes: newVotes,
        };
      });
      // clear the vote form selection
      setVoteForm({ member: '', scores: {} });
    } catch (err) {
      console.error('Failed to toggle voting exclusion:', err);
    }
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
  const handleVote = async (e) => {
    e.preventDefault();
    if (!voteForm.member) {
      alert('Please select who you are');
      return;
    }

    // Check all non-opt-out nominations have been scored
    const activeNominations = nominations.filter((n) => n.title !== null);
    const allScored = activeNominations.every((nom) => voteForm.scores[nom.id] !== undefined);
    if (!allScored) {
      alert('Please score all books before submitting');
      return;
    }

    try {
      const updatedData = await pullUpdatePush((latestData) => {
        const currentNominations = latestData.nominations ?? [];
        const currentVotes = latestData.votes ?? [];

        // Check if member already has a vote entry (partial vote from before new nominations)
        const existingVoteIndex = currentVotes.findIndex((v) => v.member === voteForm.member);
        let updatedVotes;
        if (existingVoteIndex >= 0) {
          // Merge new scores with existing scores
          updatedVotes = currentVotes.map((v, i) => {
            if (i === existingVoteIndex) {
              return { ...v, scores: { ...v.scores, ...voteForm.scores } };
            }
            return v;
          });
        } else {
          updatedVotes = [...currentVotes, { member: voteForm.member, scores: { ...voteForm.scores } }];
        }

        return {
          ...latestData,
          votes: updatedVotes,
        };
      });

      setVoteForm({ member: '', scores: {} });

      // Check if all members (except excluded) have fully voted - if so, determine winner
      const votingMembers = MEMBERS.filter((m) => !((updatedData.votes || []).some((v) => v.member === m && v.optedOut)));
      const allFullyVoted = votingMembers.every((member) => {
        const memberVote = updatedData.votes.find((v) => v.member === member);
        return memberVote && updatedData.nominations.filter((n) => n.title !== null).every((nom) => memberVote.scores[nom.id] !== undefined);
      });

      if (allFullyVoted) {
        calculateWinner(updatedData.votes, updatedData.nominations);
      }
    } catch (err) {
      console.error('Failed to submit vote:', err);
    };
  }

  // Calculate winner based on total scores
  function calculateWinner(allVotes, allNominations) {
    // Compute per-nomination sum and count from voters who actually voted (exclude opted-out)
    const sums = {};
    const counts = {};
    allNominations.forEach((nom) => {
      sums[nom.id] = 0;
      counts[nom.id] = 0;
    });

    allVotes.forEach((vote) => {
      if (vote.optedOut) return; // skip opted-out voters
      const scores = vote.scores || {};
      Object.entries(scores).forEach(([nominationId, score]) => {
        const id = Number(nominationId);
        if (sums[id] === undefined) {
          sums[id] = 0;
          counts[id] = 0;
        }
        sums[id] += Number(score) || 0;
        counts[id] += 1;
      });
    });

    // Compute averages and pick the nomination with highest average (tie-breaker: highest sum)
    let bestAvg = -1;
    let bestSum = -1;
    let winningId = null;
    Object.keys(sums).forEach((key) => {
      const id = Number(key);
      const cnt = counts[id] || 0;
      const sum = sums[id] || 0;
      const avg = cnt > 0 ? sum / cnt : 0;
      if (avg > bestAvg || (avg === bestAvg && sum > bestSum)) {
        bestAvg = avg;
        bestSum = sum;
        winningId = id;
      }
    });

    const winningNomination = allNominations.find((n) => n.id === winningId);
    const averageScore = bestAvg >= 0 ? bestAvg.toFixed(1) : '0.0';
    const maxScore = bestSum;
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
  }

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
                          <button
                            type="button"
                            className={`submit-btn ${isMemberOptedOutNom(nominationForm.member) ? 'opted-out' : ''}`}
                            onClick={() => {
                              if (!nominationForm.member) {
                                alert('Select your name first');
                                return;
                              }
                              handleToggleOptOut(nominationForm.member);
                            }}
                          >
                            {isMemberOptedOutNom(nominationForm.member) ? '✓ Opted Out' : 'Opt out'}
                          </button>
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
                              {nomination.title === null ? (
                                <>
                                  <span className="book-title">Not nominating</span>
                                  <span className="book-author" />
                                </>
                              ) : (
                                <>
                                  <span className="book-title">{nomination.title}</span>
                                  <span className="book-author">by {nomination.author}</span>
                                </>
                              )}
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

                  {/* Member preferences UI removed (opt-out controls are inline) */}
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
                                scores: existingVote && existingVote.scores ? { ...existingVote.scores } : {},
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
                          <button
                            type="button"
                            className={`submit-btn ${isMemberExcludedFromVoting(voteForm.member) ? 'opted-out' : ''}`}
                            onClick={() => {
                              const member = voteForm.member;
                              if (!member) {
                                alert('Select your name first');
                                return;
                              }
                              handleToggleExcludeFromVoting(member);
                            }}
                            title="Opt out / include in voting"
                          >
                            {isMemberExcludedFromVoting(voteForm.member) ? '✓ Opted Out' : 'Opt out'}
                          </button>
                        </div>

                        <div className="scoring-section">
                          <label>Score each book (0-10):</label>
                          <div className="score-options">
                            {nominations.filter((n) => n.title !== null).map((nom) => (
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
                        const isExcluded = isMemberExcludedFromVoting(member);
                        return (
                          <div key={member} className={`vote-status-item ${hasVoted ? 'complete' : ''} ${isExcluded ? 'excluded' : ''}`}>
                            <span className="member-name">{member}</span>
                            <div className="vote-actions">
                              <span className={hasVoted ? 'voted' : isExcluded ? 'excluded-label' : 'pending'}>
                                {isExcluded ? '⊘ Excluded' : hasVoted ? '✓ Voted' : 'Waiting...'}
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
}

export default BookClub;
