import React, { useState, useEffect } from "react";
import "./App.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { DataStore } from "@aws-amplify/datastore";
import { FileUpload } from "./models"; // Import generated model

const App: React.FC = () => {
  const { signOut } = useAuthenticator();
  const [stocksFile, setStocksFile] = useState<File | null>(null);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [uploadedDates, setUploadedDates] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchUploadedDates = async () => {
      const uploads = await DataStore.query(FileUpload);
      const dates = uploads.map((upload) => upload.date);
      setUploadedDates(dates);
    };
    fetchUploadedDates();
  }, []);

  const validateFile = (file: File | null): boolean => {
    if (file && file.name.endsWith(".csv")) {
      return true;
    }
    alert("Please upload a valid CSV file.");
    return false;
  };

  const uploadFile = async (file: File | null, apiUrl: string) => {
    if (!file) {
      alert("Please select a CSV file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const today = new Date().toISOString().split("T")[0];
        await DataStore.save(
          new FileUpload({
            date: today,
            userID: "example-user",
          })
        );

        setUploadedDates((prev) => [...prev, today]);
        setResponseMessage("File uploaded successfully!");
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

  const renderCalendar = (date: Date) => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysArray = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(<td key={`empty-${i}`} className="empty"></td>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isUploaded = uploadedDates.includes(formattedDate);
      daysArray.push(
        <td key={day} className={isUploaded ? "day uploaded" : "day"}>{day}</td>
      );
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

  return (
    <main>
      <header>
        <button onClick={signOut}>Sign out</button>
      </header>

      <h1>Anamay - Dashboard Update Interface</h1>

      <div>
        <h2>Upload Stocks File</h2>
        <input type="file" accept=".csv" onChange={(e) => setStocksFile(e.target.files?.[0] || null)} />
        <button onClick={() => validateFile(stocksFile) && uploadFile(stocksFile, "STOCKS_UPLOAD_URL")}>Submit</button>
      </div>

      <div>
        <h2>Upload Sales File</h2>
        <input type="file" accept=".csv" onChange={(e) => setSalesFile(e.target.files?.[0] || null)} />
        <button onClick={() => validateFile(salesFile) && uploadFile(salesFile, "SALES_UPLOAD_URL")}>Submit</button>
      </div>

      {responseMessage && <p>{responseMessage}</p>}

      <div className="calendar-container">
        <h3>Calendar (Daily Tracker)</h3>
        {renderCalendar(currentDate)}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Upload Status</h2>
            <p>{responseMessage}</p>
            <button onClick={() => setIsModalOpen(false)}>OK</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
