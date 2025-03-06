import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuthenticator } from '@aws-amplify/ui-react';

const App: React.FC = () => {
  const { signOut } = useAuthenticator();
  const [stocksFile, setStocksFile] = useState<File | null>(null);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchUploadStatus();
  }, [currentDate]);

  // Fetch upload status
  const fetchUploadStatus = async () => {
    try {
      const response = await fetch("https://9a9fn3wa2l.execute-api.ap-south-1.amazonaws.com/D1/deepshikatest");
      if (response.ok) {
        const data = await response.json();
        setUploadStatus(data.uploadStatus || {});
      } else {
        console.error("Failed to fetch upload status");
      }
    } catch (error) {
      console.error("Error fetching upload status:", error);
    }
  };

  // Validate file type
  const validateFile = (file: File | null): boolean => {
    if (file && file.name.endsWith(".csv")) {
      return true;
    }
    alert("Please upload a valid CSV file.");
    return false;
  };

  // Upload file function
  const uploadFile = async (file: File | null, apiUrl: string) => {
    if (!file) {
      alert("Please select a CSV file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResponseMessage(data.message || "File uploaded successfully!");
        fetchUploadStatus(); // Refresh status after upload
      } else {
        const errorText = await response.text();
        setResponseMessage(`Failed to upload file: ${errorText}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("An error occurred while uploading the file.");
    }

    setIsModalOpen(true);
  };

  // Render calendar with upload status
  const renderCalendar = (date: Date) => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysArray = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(<td key={`empty-${i}`} className="empty"></td>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
      const status = uploadStatus[dateKey] || "";
      const cellClass = status === "Yes" ? "day green" : "day red";
      daysArray.push(<td key={day} className={cellClass}>{day}</td>);
    }

    const weeks = [];
    let week = [];
    for (let i = 0; i < daysArray.length; i++) {
      week.push(daysArray[i]);
      if (week.length === 7) {
        weeks.push(<tr key={`week-${weeks.length}`}>{week}</tr>);
        week = [];
      }
    }
    if (week.length > 0) {
      weeks.push(<tr key={`week-${weeks.length}`}>{week}</tr>);
    }

    return (
      <table className="calendar-table">
        <thead>
          <tr>
            <th>Sun</th>
            <th>Mon</th>
            <th>Tue</th>
            <th>Wed</th>
            <th>Thu</th>
            <th>Fri</th>
            <th>Sat</th>
          </tr>
        </thead>
        <tbody>{weeks}</tbody>
      </table>
    );
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '90vw', backgroundColor: '#f8f8ff' }}>
      <header style={{ width: '100%' }}>
        <button style={{ marginLeft: 'auto', marginRight: '20px' }} onClick={signOut}>
          Sign out
        </button>
      </header>

      <h1 style={{ padding: '10px', textAlign: 'center', width: '100vw' }}>
        <u>Anamay - Dashboard Update Interface</u>
      </h1>

      {/* Calendar Component */}
      <div style={{ position: 'absolute', top: '40vh', right: '10vw', width: '25vw', padding: '20px', backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
        <h3 style={{ textAlign: 'center' }}>Calendar (daily tracker)</h3>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button onClick={prevMonth}>&lt; </button>
          <span style={{ margin: '0 10px' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth}>&gt; </button>
        </div>
        {renderCalendar(currentDate)}
      </div>
    </main>
  );
};

export default App;
