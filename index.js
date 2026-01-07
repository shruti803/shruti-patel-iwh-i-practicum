require("dotenv").config();

const path = require("path");
const express = require("express");
const axios = require("axios");

const app = express();

// ENV
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const PORT = process.env.PORT || 3000;

// Custom object + properties (internal names)
const CUSTOM_OBJECT_TYPE = "2-51544776";
const PROPERTIES = ["name", "house", "family_type"];

// Basic validation (helps debugging)
if (!PRIVATE_APP_ACCESS) {
  console.error("Missing PRIVATE_APP_ACCESS in your .env file.");
}

// View engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static CSS at /css/style.css -> public/css/style.css
app.use("/css", express.static(path.join(__dirname, "public/css")));

// Axios client for HubSpot
const hubspot = axios.create({
  baseURL: "https://api.hubapi.com",
  headers: {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    "Content-Type": "application/json",
  },
});

// ROUTE 1: Homepage - list custom object records in a table
app.get("/", async (req, res) => {
  try {
    const response = await hubspot.get(`/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, {
      params: {
        limit: 100,
        properties: PROPERTIES.join(","),
      },
    });

    const data = response.data.results || [];

    res.render("homepage", {
      title: "Homepage | Integrating With HubSpot I Practicum",
      data,
    });
  } catch (error) {
    console.error("GET / error:", error?.response?.data || error.message);
    res.status(500).send("Error fetching custom objects. Check console.");
  }
});

// ROUTE 2: Form page to create a new record
app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
  });
});

// ROUTE 3: Handle form submission - create record, then redirect home
app.post("/update-cobj", async (req, res) => {
  try {
    const { name, house, family_type } = req.body;

    const payload = {
      properties: {
        name,
        house,
        family_type,
      },
    };

    await hubspot.post(`/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`, payload);

    // Required: redirect to homepage after create
    res.redirect("/");
  } catch (error) {
    console.error("POST /update-cobj error:", error?.response?.data || error.message);
    res.status(500).send("Failed to create record. Check console for details.");
  }
});

// Localhost
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
