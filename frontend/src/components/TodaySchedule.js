import React, { useState, useEffect } from 'react';

function TodaySchedule() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTodaySchedule();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule/today');
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      const data = await response.json();
      setSchedule(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const min = minutes;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${min} ${period}`;
  };

  const isClassHappening = (startTime, endTime) => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    return currentTimeStr >= startTime && currentTimeStr <= endTime;
  };

  const getTimeUntilClass = (startTime) => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    if (currentTimeStr >= startTime) {
      return 'in progress or past';
    }

    const [startHours, startMins] = startTime.split(':').map(Number);
    const [curHours, curMins] = currentTimeStr.split(':').map(Number);

    const startTotalMins = startHours * 60 + startMins;
    const curTotalMins = curHours * 60 + curMins;
    const diffMins = startTotalMins - curTotalMins;

    if (diffMins < 60) {
      return `in ${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `in ${hours}h ${mins}m`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div> Loading your schedule...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>⚠️ Error loading schedule: {error}</p>
      </div>
    );
  }

  return (
    <div className="today-schedule">
      <div className="schedule-header">
        <h2>📅 Today's Schedule</h2>
        <p className="date-display">
          {schedule?.day || 'Unknown'} · {schedule?.date}
        </p>
        <p className="time-display">
          Current time: {currentTime.toLocaleTimeString()}
        </p>
      </div>

      {schedule?.classes?.length === 0 ? (
        <div className="no-classes">
          <p>🎉 No classes today! Time to relax or catch up on reading.</p>
        </div>
      ) : (
        <div className="classes-list">
          {schedule?.classes?.map((cls, index) => {
            const isHappening = isClassHappening(cls.start_time, cls.end_time);
            const timeUntil = getTimeUntilClass(cls.start_time);

            return (
              <div
                key={index}
                className={`class-card ${isHappening ? 'happening-now' : ''}`}
              >
                <div className="class-time">
                  <span className="time-badge">
                    {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                  </span>
                  {isHappening && <span className="live-badge">🔴 Live</span>}
                  {!isHappening && (
                    <span className="countdown">{timeUntil}</span>
                  )}
                </div>

                <div className="class-info">
                  <h3>{cls.course_code}</h3>
                  <h4>{cls.course_name}</h4>
                  <p className="professor">
                    Prof. {cls.professor || 'Staff'}
                  </p>
                  <div className="class-location">
                    <span>📍 {cls.room}</span>
                  </div>
                </div>

                {isHappening && (
                  <div className="class-status happening">
                    ✓ Class in progress
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TodaySchedule;
