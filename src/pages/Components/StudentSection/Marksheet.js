import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";

const Marksheet = () => {
  const [rows, setRows] = useState([]);
  const { data: session, status } = useSession();

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/getMarksheetData", {
        params: { StudentId: session?.user?.id },
      });
      if (response.data) {
        const modifiedData = response.data.map((row) => ({
          ...row,
          Total: 100,
        }));
        console.log(response.data);
        setRows(modifiedData);
        toast.success("Data fetched successfully!");
      } else {
        toast.error("No data found");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data.");
    }
  };

  useEffect(() => {
    if (session?.user?.id) fetchData();
  }, [session?.user?.id]);

  const calculatePercentage = () => {
    const totalMarksObtained = rows.reduce(
      (sum, row) => sum + row.marks_obtained,
      0
    );
    const totalMarks = rows.reduce((sum, row) => sum + row.Total, 0);
    return ((totalMarksObtained / totalMarks) * 100).toFixed(2);
  };

  const generateMarksheet = async () => {
    const doc = new jsPDF();
  
    // Load the image from the public folder
    const imgUrl = "/ProjectLogo.png"; // Image is directly in the public folder
    const img = new Image();
    img.src = imgUrl;
  
    img.onload = () => {
      // Add the image as a watermark before adding the table
      doc.setGState(new doc.GState({ opacity: 0.1 })); // Set opacity for the watermark
      doc.addImage(img, "PNG", 30, 50, 150, 150); // Adjust position and size as needed
      doc.setGState(new doc.GState({ opacity: 1 })); // Reset opacity back to full for text and table
  
      // Now add the text and table over the watermark
      doc.setFontSize(18);
      doc.text("Learn Linker", 105, 20, null, null, "center");
  
      doc.setFontSize(12);
      const studentName = `Student Name: ${session?.user?.name}`;
      doc.text(studentName, 20, 40);
  
      const startY = 50;
  
      const headers = ["Subject Name", "Marks Obtained", "Total Marks"];
      const data = rows.map((row) => [
        row.subject_name,
        row.marks_obtained,
        row.Total,
      ]);
  
      // Generate the table after the watermark
      doc.autoTable({
        head: [headers],
        body: data,
        startY: startY,
      });
  
      const finalY = doc.lastAutoTable.finalY + 10;
      const percentageText = `Percentage: ${calculatePercentage()}%`;
      doc.text(percentageText, 20, finalY);
  
      // Save the PDF
      doc.save("marksheet.pdf");
    };
  };
  
  

  const columns = [
    { field: "subject_name", headerName: "Subject Name", width: 200 },
    { field: "marks_obtained", headerName: "Marks Obtained", width: 200 },
    { field: "Total", headerName: "Total Marks", width: 200 },
  ];

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Button
              variant="contained"
              sx={{ mr: 4 }}
              onClick={generateMarksheet}
              disabled={rows.length === 0}
            >
              Generate Marksheet
            </Button>
          </CardContent>
          <CardContent sx={{ pt: 0 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => `${row.id}`}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Marksheet;
