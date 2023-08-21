import "./App.css";
import FileUpload from "./FileUpload";
import { Container } from "@mui/system";
import { Paper } from "@mui/material";

function App() {
  return (
    <Container maxWidth="sm">
      <Paper elevation={3} style={{ padding: '2rem' }}>
        <FileUpload />
      </Paper>
    </Container>
  );
}

export default App;
