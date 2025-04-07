import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// Middleware für das Parsen von JSON-Daten
app.use(express.json());

// EJS einrichten
app.set("view engine", "ejs");

// PostgreSQL-Datenbankverbindung
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


app.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM books ORDER BY review_date DESC");
  
      // Füge die Eigenschaft `isTruncated` hinzu
      const books = result.rows.map(item => {
        const isTruncated = item.review_text.length > 100;
        console.log(`ID: ${item.id}, Length: ${item.review_text.length}, isTruncated: ${isTruncated}`);
        return {
          ...item,
          isTruncated,
        };
      });
  
      console.log("Books being sent to EJS:", books); // Debugging-Log
      res.render("index", { listItems: books });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    }
  });

  // Route zum Hinzufügen eines neuen Items
  app.post("/add", async (req, res) => {
    const { coverNew, titleNew, reviewNew, authorNew } = req.body;
     // Datum im ISO-Format für die Datenbank
  const dateNew = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  
    try {
      await pool.query(
        "INSERT INTO books (url_book_cover, book_title, review_text, review_date, review_author) VALUES ($1, $2, $3, $4, $5)",
        [coverNew, titleNew, reviewNew, dateNew, authorNew]
      );
      res.redirect("/"); // Nach dem Hinzufügen zur Startseite zurückkehren
    } catch (err) {
      console.error(err);
      res.status(500).send("Error adding new item to the database");
    }
  });

// Route für alphabetisches Sortieren
app.get('/sort/alpha', async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM books ORDER BY book_title ASC");
  
      // Füge die Eigenschaft `isTruncated` hinzu
      const books = result.rows.map(item => ({
        ...item,
        isTruncated: item.review_text.length > 100 // Prüft, ob der Text abgeschnitten werden soll
      }));
  
      res.render("index", { listItems: books });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving sorted data from database");
    }
  });

  app.get('/sort/latest', async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM books ORDER BY review_date DESC");
      res.render("index", { listItems: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving sorted data from database");
    }
  });

  app.get('/sort/oldest', async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM books ORDER BY review_date ASC");
      res.render("index", { listItems: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving sorted data from database");
    }
  });


  app.post('/delete/:id', async (req, res) => {
    const bookId = req.params.id;
    try {
      await pool.query("DELETE FROM books WHERE id = $1", [bookId]);
      res.redirect('/'); // Nach dem Löschen zur Startseite zurückkehren
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting the book");
    }
  });

  app.post("/edit/:id", async (req, res) => {
    const bookId = req.params.id;
    const { reviewText } = req.body;
  
    try {
      await pool.query("UPDATE books SET review_text = $1 WHERE id = $2", [reviewText, bookId]);
      res.status(200).send("Review updated successfully");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating the review");
    }
  });



// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});