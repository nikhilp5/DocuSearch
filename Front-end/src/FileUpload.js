import React, { useState } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [textValue, setTextValue] = useState("");
  const [showTextBox, setShowTextBox] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [apiResponse, setApiResponse] = useState("");
  const apiKey = `${process.env.REACT_APP_API_KEY}`;
  const config = {
    headers: {
      "x-api-key": apiKey,
    },
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    try {
      if (file) {
        setUploading(true);
        const fileData = await convertFileToBase64(file);
        await sendToAPI(fileData, textValue);
        alert("File uploaded successfully!");
        setShowResults(true);
      } else {
        alert("Please provide the zip file.");
      }
    } catch (error) {
      console.error("Error uploading data:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleShowResults = async () => {
    try {
      setUploading(true);
      const response = await sendToSecondAPI(apiResponse);
      const modifiedResponse = response.data.map((eachData) => {
        return {
          title: eachData.Title.replace(/\.[^/.]+$/, ""),
          detectedPart: eachData.DetectedPart,
        };
      });
      setApiResponse(modifiedResponse);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setUploading(false);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendToAPI = async (fileData, textValue) => {
    const apiUrl = `${process.env.REACT_APP_UPLOAD_API}`;
    try {
      const response = await axios.post(
        apiUrl,
        {
          file: fileData,
        },
        config
      );
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const sendToSecondAPI = async (data) => {
    const apiUrl = `${process.env.REACT_APP_SEARCH_API}`;
    try {
      const response = await axios.post(apiUrl, { text: textValue }, config);
      return response;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };
  const highlightWord = (title) => {
    if (textValue && title.includes(textValue)) {
      const regex = new RegExp(`(${textValue})`, "g");
      const parts = title.split(regex);
      return (
        <>
          {parts.map((part, index) => (
            <span
              key={index}
              style={
                part.toLowerCase() === textValue.toLowerCase()
                  ? { backgroundColor: "#ffeeba" }
                  : {}
              }
            >
              {part}
            </span>
          ))}
        </>
      );
    } else {
      return title;
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "2rem",
      }}
    >
	  <Typography variant="h4" gutterBottom>
        DocuSearch
      </Typography>
      <Typography variant="h5" gutterBottom>
        Upload Zip File Containing Documents and Enter Text
      </Typography>
      <input
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        style={{ marginBottom: "1rem" }}
      />
      <TextField
        label="Enter text"
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        fullWidth
        variant="outlined"
        style={{ marginBottom: "1rem" }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        startIcon={<CloudUploadIcon />}
        disabled={uploading || showResults}
      >
        {uploading ? <CircularProgress size={20} /> : "Upload"}
      </Button>

      {showResults && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleShowResults}
          style={{ marginTop: "1rem" }}
          disabled={uploading}
        >
          {uploading ? <CircularProgress size={20} /> : "Show Results"}
        </Button>
      )}

      {apiResponse && apiResponse.length != 0 ? (
        <Box sx={{ marginTop: "2rem" }}>
          <Typography variant="h6" gutterBottom>
            Result:
          </Typography>
          <div>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell>Detected Part/Derived Meaning</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiResponse.map((eachResponse) => (
                    <TableRow>
                      <TableCell>{eachResponse.title}</TableCell>
                      <TableCell>
                        {highlightWord(eachResponse.detectedPart)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </Box>
      ) : (
        <Typography variant="h6" gutterBottom>
          No Documents Available
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
