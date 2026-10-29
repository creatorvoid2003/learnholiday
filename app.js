
/* =========================================================
   LEARNHOLIDAY — SHARED APPLICATION JAVASCRIPT
   ========================================================= */

"use strict";

const LearnHoliday = (() => {
  const STORAGE_KEYS = {
    saved: "learnholiday_saved_resources",
    completed: "learnholiday_completed_activities"
  };

  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Could not save LearnHoliday data:", error);
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
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

    if (type) {
      element.classList.add(type);
    }
  }

  function updateYear() {
    const year = String(new Date().getFullYear());

    document.querySelectorAll("#current-year").forEach(element => {
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
        const cardSubject = card.dataset.subject || "";
        const matchesSubject =
          subject === "all" || cardSubject === subject;

        const matchesText = card.textContent
          .toLowerCase()
          .includes(query);

        const visible = matchesSubject && matchesText;

        card.hidden = !visible;

        if (visible) visibleCount++;
      });

      if (empty) {
        empty.hidden = visibleCount !== 0;
      }
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
        const cardSubject = card.dataset.subject || "";
        const matchesSubject =
          subject === "all" || cardSubject === subject;

        const matchesText = card.textContent
          .toLowerCase()
          .includes(query);

        const visible = matchesSubject && matchesText;

        card.hidden = !visible;

        if (visible) visibleCount++;
      });

      if (empty) {
        empty.hidden = visibleCount !== 0;
      }
    }

    search.addEventListener("input", applyFilters);
    filter.addEventListener("change", applyFilters);

    applyFilters();
  }

  /* SAVED RESOURCES */

  function saveResource(id, title) {
    const resources = readStorage(STORAGE_KEYS.saved);
    const exists = resources.some(resource => resource.id === id);

    if (exists) {
      return { success: true, alreadySaved: true };
    }

    resources.push({
      id,
      title,
      savedAt: new Date().toISOString()
    });

    const success = writeStorage(STORAGE_KEYS.saved, resources);

    return {
      success,
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
          window.alert(
            "Your resource could not be saved. Check your browser storage settings."
          );
          return;
        }

        updateSaveButtons();

        if (result.alreadySaved) {
          window.alert("This resource is already saved.");
        } else {
          window.alert("Resource saved successfully.");
        }
      });
    });

    updateSaveButtons();
  }

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
          <p>Available in your browser's saved-resource list.</p>
        </div>
        <button
          class="button button-outline remove-resource"
          type="button"
          data-resource-id="${escapeHTML(resource.id || "")}"
        >
          Remove
        </button>
      </article>
    `).join("");

    savedContainer.querySelectorAll(".remove-resource").forEach(button => {
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

      const code = codeInput.value.trim();

      if (!code) {
        setMessage(message, "Enter a class code first.", "error");
        return;
      }

      setMessage(
        message,
        "Class joining is not available yet. A real classroom service must be connected.",
        "error"
      );
    });
  }

  /* SUPABASE CLIENT */

  function getSupabaseClient() {
    const config = window.LEARNHOLIDAY_SUPABASE_CONFIG;
    const library = window.supabase;

    if (!config || !library || typeof library.createClient !== "function") {
      return null;
    }

    const url = config.url || "";
    const key = config.anonKey || "";

    if (
      !url.startsWith("https://") ||
      url.includes("YOUR-PROJECT-REF") ||
      !key ||
      key.includes("YOUR_SUPABASE")
    ) {
      return null;
    }

    try {
      return library.createClient(url, key);
    } catch (error) {
      console.error("Could not initialise Supabase:", error);
      return null;
    }
  }

  /* REGISTRATION */

  function setupRegistration() {
    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");

    if (!form || !message) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const name = document.getElementById("register-name").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const level = document.getElementById("register-level").value;
      const password = document.getElementById("register-password").value;
      const confirmation =
        document.getElementById("register-confirm").value;

      if (name.length < 2) {
        setMessage(message, "Enter your full name.", "error");
        return;
      }

      if (password.length < 8) {
        setMessage(
          message,
          "Your password must contain at least 8 characters.",
          "error"
        );
        return;
      }

      if (password !== confirmation) {
        setMessage(message, "Your passwords do not match.", "error");
        return;
      }

      const client = getSupabaseClient();

      if (!client) {
        setMessage(
          message,
          "Supabase is not configured. Add your project URL and publishable/anon key to assets/js/supabase-config.js.",
          "error"
        );
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
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          setMessage(
            message,
            "Your account has been created. Opening your dashboard...",
            "success"
          );

          window.location.assign("dashboard.html");
          return;
        }

        setMessage(
          message,
          "Registration submitted. Check your email for a confirmation link if email confirmation is enabled.",
          "success"
        );

        form.reset();
      } catch (error) {
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
    const message = document.getElementById("login-message");

    if (!form || !message) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      const client = getSupabaseClient();

      if (!client) {
        setMessage(
          message,
          "Supabase is not configured. Add your project URL and publishable/anon key to assets/js/supabase-config.js.",
          "error"
        );
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

  function init() {
    updateYear();
    setupCourseFilters();
    setupResourceFilters();
    setupSaveButtons();
    renderDashboard();
    setupClassroomForm();
    setupRegistration();
    setupLogin();
  }

  return {
    init,
    saveResource,
    removeResource,
    renderDashboard
  };
})();

document.addEventListener("DOMContentLoaded", LearnHoliday.init);
