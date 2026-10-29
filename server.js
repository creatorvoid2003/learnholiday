
const express = require("express");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");

// Basic security headers and Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "wss://*.supabase.co"
        ]
      }
    }
  })
);

// Serve the LearnHoliday website files
app.use(
  express.static(__dirname, {
    index: "index.html",
    extensions: ["html"]
  })
);

// Test whether the server is running
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "LearnHoliday"
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`LearnHoliday is running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(
    "Configure Supabase in assets/js/supabase-config.js before testing authentication."
  );
});
