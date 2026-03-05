import { useState } from 'react';
import './Nominations.css';

const Nominations = () => {
  const [nominations, setNominations] = useState([
    { id: 1, title: "Project Hail Mary", author: "Andy Weir", nominatedBy: "Sarah", reason: "Amazing sci-fi with great problem-solving elements!" },
    { id: 2, title: "The House in the Cerulean Sea", author: "TJ Klune", nominatedBy: "Mike", reason: "Heartwarming fantasy about found family." },
    { id: 3, title: "Klara and the Sun", author: "Kazuo Ishiguro", nominatedBy: "Emma", reason: "Beautiful exploration of what it means to be human." },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    nominatedBy: '',
    reason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.nominatedBy) {
      alert('Please fill in all required fields');
      return;
    }

    const newNomination = {
      id: Date.now(),
      ...formData,
    };

    setNominations(prev => [...prev, newNomination]);
    setFormData({ title: '', author: '', nominatedBy: '', reason: '' });
  };

  return (
    <div className="nominations">
      <header className="page-header">
        <h2>📝 Book Nominations</h2>
        <p>Suggest books you'd love the club to read!</p>
      </header>

      <div className="nominations-content">
        <section className="nomination-form-section">
          <h3>Nominate a Book</h3>
          <form onSubmit={handleSubmit} className="nomination-form">
            <div className="form-group">
              <label htmlFor="title">Book Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter the book title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author *</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Enter the author's name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nominatedBy">Your Name *</label>
              <input
                type="text"
                id="nominatedBy"
                name="nominatedBy"
                value={formData.nominatedBy}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reason">Why this book?</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Share why you think the club should read this book..."
                rows={3}
              />
            </div>

            <button type="submit" className="submit-btn">
              Submit Nomination
            </button>
          </form>
        </section>

        <section className="nominations-list-section">
          <h3>Current Nominations ({nominations.length})</h3>
          <div className="nominations-list">
            {nominations.map((nom) => (
              <div key={nom.id} className="nomination-card">
                <div className="nomination-header">
                  <h4>{nom.title}</h4>
                  <span className="author">by {nom.author}</span>
                </div>
                <p className="reason">{nom.reason}</p>
                <div className="nominated-by">
                  Nominated by <strong>{nom.nominatedBy}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Nominations;
