
import { pool } from "../../../lib/db"; // Adjust the import path according to your project structure

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { subjects } = req.body; // Expecting an array of subject objects

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const promises = subjects.map(
        ({ student_id, student_name, present, absent, date }) => {
            const queryText = `
            INSERT INTO public."attendance" (student_id, student_name, present, absent, date)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (student_id, date) 
            DO UPDATE SET 
              present = EXCLUDED.present,
              absent = EXCLUDED.absent
          `;
          
          return client.query(queryText, [
            student_id,
            student_name,
            present,
            absent,
            date,
          ]);
        }
      );

      // Wait for all insertion queries to complete
      await Promise.all(promises);
      await client.query("COMMIT");

      res
        .status(200)
        .json({ message: "Data inserted or updated successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error inserting data:", error);
      res.status(500).json({ error: "Something went wrong" });
    } finally {
      client.release();
    }
  }
  else if (req.method === "GET") {
    try {
      const { selectedDate } = req.query; 
  
      const client = await pool.connect();
      try {
        const result = await client.query("SELECT * FROM public.attendance WHERE date = $1", [selectedDate]);
     
        res.status(200).json(result.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error executing query", error);
      res.status(500).json({ error: "An error occurred" });
    }
  }
  
  else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}