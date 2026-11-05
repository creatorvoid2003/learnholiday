
/* =========================================================
   LEARNHOLIDAY — SHARED APPLICATION JAVASCRIPT
   ========================================================= */

"use strict";

const LearnHoliday = (() => {
  const STORAGE_KEYS = {
    saved: "learnholiday_saved_resources",
    completed: "learnholiday_completed_activities"
  };

  let supabaseClient = null;

  /* STORAGE */

  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error("Storage read error:", error);
      return [];
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage write error:", error);
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function setMessage(element, message, type = "") {
    if (!element) return;

    element.textContent = message;
    element.classList.remove("error", "success");

    if (type) element.classList.add(type);
  }

  function updateYear() {
    const year = String(new Date().getFullYear());

    document.querySelectorAll("#current-year, [data-year]")
      .forEach(element => {
        element.textContent = year;
      });
  }

  /* COURSE SEARCH AND FILTER */

  function setupCourseFilters() {
    const search = document.getElementById("course-search");
    const filter = document.getElementById("course-filter");
    const list = document.getElementById("course-list");
    const empty = document.getElementById("course-empty");

    if (!search || !filter || !list) return;

    function applyFilters() {
      const query = search.value.trim().toLowerCase();
      const subject = filter.value;
      let visibleCount = 0;

      list.querySelectorAll("[data-subject]").forEach(card => {
        const matchesSubject =
          subject === "all" || card.dataset.subject === subject;

        const matchesText =
          card.textContent.toLowerCase().includes(query);

        card.hidden = !(matchesSubject && matchesText);

        if (!card.hidden) visibleCount++;
      });

      if (empty) empty.hidden = visibleCount !== 0;
    }

    search.addEventListener("input", applyFilters);
    filter.addEventListener("change", applyFilters);

    applyFilters();
  }

  /* STUDY RESOURCE SEARCH */

  function setupResourceFilters() {
    const search = document.getElementById("resource-search");
    const filter = document.getElementById("resource-filter");
    const list = document.getElementById("resource-list");
    const empty = document.getElementById("resource-empty");

    if (!search || !filter || !list) return;

    function applyFilters() {
      const query = search.value.trim().toLowerCase();
      const subject = filter.value;
      let visibleCount = 0;

      list.querySelectorAll("[data-subject]").forEach(card => {
        const matchesSubject =
          subject === "all" || card.dataset.subject === subject;

        const matchesText =
          card.textContent.toLowerCase().includes(query);

        card.hidden = !(matchesSubject && matchesText);

        if (!card.hidden) visibleCount++;
      });

      if (empty) empty.hidden = visibleCount !== 0;
    }

    search.addEventListener("input", applyFilters);
    filter.addEventListener("change", applyFilters);

    applyFilters();
  }

  /* SAVED RESOURCES */

  function saveResource(id, title) {
    const resources = readStorage(STORAGE_KEYS.saved);

    if (resources.some(resource => resource.id === id)) {
      return { success: true, alreadySaved: true };
    }

    resources.push({
      id,
      title,
      savedAt: new Date().toISOString()
    });

    return {
      success: writeStorage(STORAGE_KEYS.saved, resources),
      alreadySaved: false
    };
  }

  function removeResource(id) {
    const resources = readStorage(STORAGE_KEYS.saved)
      .filter(resource => resource.id !== id);

    writeStorage(STORAGE_KEYS.saved, resources);
    renderDashboard();
    updateSaveButtons();
  }

  function updateSaveButtons() {
    const saved = readStorage(STORAGE_KEYS.saved);
    const savedIds = new Set(saved.map(resource => resource.id));

    document.querySelectorAll(".save-resource").forEach(button => {
      const isSaved = savedIds.has(button.dataset.resourceId);

      button.textContent = isSaved ? "Saved ✓" : "Save resource";
      button.setAttribute("aria-pressed", String(isSaved));
    });
  }

  function setupSaveButtons() {
    document.querySelectorAll(".save-resource").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.resourceId;
        const title = button.dataset.resourceTitle;

        if (!id || !title) return;

        const result = saveResource(id, title);

        if (!result.success) {
          window.alert("Your resource could not be saved.");
          return;
        }

        updateSaveButtons();

        window.alert(
          result.alreadySaved
            ? "This resource is already saved."
            : "Resource saved successfully."
        );
      });
    });

    updateSaveButtons();
  }

  /* DASHBOARD STATISTICS */

  function renderDashboard() {
    const saved = readStorage(STORAGE_KEYS.saved);
    const completed = readStorage(STORAGE_KEYS.completed);

    const savedCount = document.getElementById("saved-count");
    const completedCount = document.getElementById("completed-count");
    const savedContainer = document.getElementById("saved-resources");

    if (savedCount) {
      savedCount.textContent = String(saved.length);
    }

    if (completedCount) {
      completedCount.textContent = String(completed.length);
    }

    if (!savedContainer) return;

    if (saved.length === 0) {
      savedContainer.innerHTML = `
        <article class="resource-card">
          <div class="resource-info">
            <h2>No saved resources yet</h2>
            <p>Visit the Study Centre and save a resource to see it here.</p>
            <a class="button button-primary" href="study-centre.html">
              Browse resources
            </a>
          </div>
        </article>
      `;
      return;
    }

    savedContainer.innerHTML = saved.map(resource => `
      <article class="resource-card">
        <div class="resource-type">SAVED</div>
        <div class="resource-info">
          <h2>${escapeHTML(resource.title || "Saved resource")}</h2>
          <p>Available in your saved-resource list.</p>
        </div>
        <button
          class="button button-outline remove-resource"
          type="button"
          data-resource-id="${escapeHTML(resource.id || "")}">
          Remove
        </button>
      </article>
    `).join("");

    savedContainer.querySelectorAll(".remove-resource")
      .forEach(button => {
        button.addEventListener("click", () => {
          removeResource(button.dataset.resourceId);
        });
      });
  }

  /* CLASSROOM PREVIEW */

  function setupClassroomForm() {
    const form = document.getElementById("classroom-form");
    const codeInput = document.getElementById("class-code");
    const message = document.getElementById("classroom-message");

    if (!form || !codeInput || !message) return;

    form.addEventListener("submit", event => {
      event.preventDefault();

      if (!codeInput.value.trim()) {
        setMessage(message, "Enter a class code first.", "error");
        return;
      }

      setMessage(
        message,
        "Class joining is not available yet. A classroom service must be connected.",
        "error"
      );
    });
  }

  /* SUPABASE CLIENT */

  function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    const config = window.LEARNHOLIDAY_SUPABASE_CONFIG;
    const library = window.supabase;

    if (
      !config ||
      !library ||
      typeof library.createClient !== "function"
    ) {
      console.error("Supabase configuration or library is missing.");
      return null;
    }

    const url = config.url || "";
    const key = config.anonKey || "";

    if (!url.startsWith("https://") || !key) {
      console.error("Supabase URL or publishable key is invalid.");
      return null;
    }

    try {
      supabaseClient = library.createClient(url, key);
      return supabaseClient;
    } catch (error) {
      console.error("Supabase initialisation failed:", error);
      return null;
    }
  }

  /* DASHBOARD AUTHENTICATION */

  async function setupDashboardAuth() {
    const learnerName = document.getElementById("learner-name");
    const dashboardName = document.getElementById("dashboard-name");
    const logoutButton = document.getElementById("logout-button");
    const message = document.getElementById("dashboard-message");

    if (!learnerName && !dashboardName && !logoutButton) return;

    const client = getSupabaseClient();

    if (!client) {
      if (learnerName) learnerName.textContent = "Account unavailable";
      setMessage(message, "Unable to connect to your account.", "error");
      return;
    }

    try {
      setMessage(message, "Checking your account...");

      const { data, error } = await client.auth.getUser();

      if (error) throw error;

      if (!data.user) {
        window.location.replace("login.html");
        return;
      }

      const user = data.user;
      const name =
        user.user_metadata?.full_name ||
        user.email ||
        "Learner";

      if (learnerName) learnerName.textContent = name;
      if (dashboardName) dashboardName.textContent = name;

      setMessage(message, "You are successfully signed in.", "success");

      if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
          logoutButton.disabled = true;

          try {
            const { error: logoutError } = await client.auth.signOut();

            if (logoutError) throw logoutError;

            window.location.replace("login.html");
          } catch (error) {
            console.error("Logout error:", error);
            logoutButton.disabled = false;
            setMessage(message, "Could not log out. Please try again.", "error");
          }
        });
      }
    } catch (error) {
      console.error("Dashboard authentication error:", error);

      if (learnerName) learnerName.textContent = "Account unavailable";

      setMessage(
        message,
        error.message || "Could not load your account.",
        "error"
      );
    }
  }

  /* REGISTRATION */

  function setupRegistration() {
    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");

    if (!form || !message) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const name =
        document.getElementById("register-name").value.trim();
      const email =
        document.getElementById("register-email").value.trim();
      const level =
        document.getElementById("register-level").value;
      const password =
        document.getElementById("register-password").value;
      const confirmation =
        document.getElementById("register-confirm").value;

      if (name.length < 2) {
        setMessage(message, "Enter your full name.", "error");
        return;
      }

      if (password.length < 8) {
        setMessage(message, "Password must contain at least 8 characters.", "error");
        return;
      }

      if (password !== confirmation) {
        setMessage(message, "Your passwords do not match.", "error");
        return;
      }

      const client = getSupabaseClient();

      if (!client) {
        setMessage(message, "Supabase is not configured correctly.", "error");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;

      setMessage(message, "Creating your account...");

      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              learning_level: level
            },
            emailRedirectTo: window.location.origin + "/dashboard.html"
          }
        });

        if (error) throw error;

        if (data.session) {
          setMessage(message, "Account created. Opening your dashboard...", "success");
          window.location.assign("dashboard.html");
          return;
        }

        setMessage(
          message,
          "Registration submitted. Check your email for a confirmation link.",
          "success"
        );

        form.reset();
      } catch (error) {
        console.error("Registration error:", error);
        setMessage(
          message,
          error.message || "Registration failed. Please try again.",
          "error"
        );
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  /* LOGIN */

  function setupLogin() {
    const form = document.getElementById("login-form");
    const message =
      document.getElementById("login-message") ||
      document.getElementById("auth-message");

    if (!form || !message) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const email =
        document.getElementById("login-email")?.value.trim() ||
        form.querySelector('[name="email"]')?.value.trim();

      const password =
        document.getElementById("login-password")?.value ||
        form.querySelector('[name="password"]')?.value;

      const client = getSupabaseClient();

      if (!client) {
        setMessage(message, "Supabase is not configured correctly.", "error");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;

      setMessage(message, "Signing you in...");

      try {
        const { error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        setMessage(message, "Login successful. Opening your dashboard...", "success");
        window.location.assign("dashboard.html");
      } catch (error) {
        console.error("Login error:", error);
        setMessage(
          message,
          error.message || "Login failed. Check your details and try again.",
          "error"
        );
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  /* STARTUP */

  async function init() {
    updateYear();
    setupCourseFilters();
    setupResourceFilters();
    setupSaveButtons();
    renderDashboard();
    setupClassroomForm();
    setupRegistration();
    setupLogin();

    await setupDashboardAuth();
  }

  return {
    init,
    saveResource,
    removeResource,
    renderDashboard,
    getSupabaseClient,
    setupDashboardAuth
  };
})();

/* MAKE THE APPLICATION AVAILABLE FOR DEBUGGING */

window.LearnHoliday = LearnHoliday;

document.addEventListener("DOMContentLoaded", LearnHoliday.init);
