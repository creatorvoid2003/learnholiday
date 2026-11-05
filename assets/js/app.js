
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
  let currentUser = null;
  let cloudSavedResources = [];

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

  /* SUPABASE RESOURCE PROGRESS */
  async function loadUserProgress() {
    if (!currentUser) { cloudSavedResources = []; return; }
    const { data, error } = await getSupabaseClient().from('user_progress')
      .select('resource_id,is_saved,is_completed').eq('user_id', currentUser.id);
    if (error) throw error;
    cloudSavedResources = data || [];
  }
  async function saveResource(id, title) {
    if (!currentUser) return { success: false, message: 'Please log in to save resources.' };
    const client = getSupabaseClient();
    const existing = cloudSavedResources.find(row => row.resource_id === id);
    const result = existing
      ? await client.from('user_progress').update({ is_saved: true, updated_at: new Date().toISOString() }).eq('user_id', currentUser.id).eq('resource_id', id)
      : await client.from('user_progress').insert({ user_id: currentUser.id, resource_id: id, is_saved: true, is_completed: false });
    if (result.error) throw result.error;
    await loadUserProgress(); renderDashboard(); updateSaveButtons();
    return { success: true, alreadySaved: Boolean(existing && existing.is_saved) };
  }
  async function removeResource(id) {
    const { error } = await getSupabaseClient().from('user_progress').update({ is_saved: false }).eq('user_id', currentUser.id).eq('resource_id', id);
    if (error) { window.alert('Could not remove this resource.'); return; }
    await loadUserProgress(); renderDashboard(); updateSaveButtons();
  }
  function updateSaveButtons() {
    const ids = new Set(cloudSavedResources.filter(row => row.is_saved).map(row => row.resource_id));
    document.querySelectorAll('.save-resource').forEach(button => {
      const saved = ids.has(button.dataset.resourceId);
      button.textContent = saved ? 'Saved ✓' : 'Save resource';
      button.setAttribute('aria-pressed', String(saved));
    });
  }
  function renderDashboard() {
    const saved = cloudSavedResources.filter(row => row.is_saved);
    const count = document.getElementById('saved-count');
    const completedCount = document.getElementById('completed-count');
    const container = document.getElementById('saved-resources');
    if (count) count.textContent = String(saved.length);
    if (completedCount) completedCount.textContent = String(cloudSavedResources.filter(row => row.is_completed).length);
    if (!container) return;
    if (!saved.length) { container.innerHTML = '<article class="resource-card"><div class="resource-info"><h2>No saved resources yet</h2><p>Visit the Study Centre and save a resource to see it here.</p><a class="button button-primary" href="study-centre.html">Browse resources</a></div></article>'; return; }
    container.innerHTML = saved.map(row => '<article class="resource-card"><div class="resource-type">SAVED</div><div class="resource-info"><h2>Saved study resource</h2><p>Saved to your LearnHoliday account.</p></div><button class="button button-outline remove-resource" data-resource-id="' + escapeHTML(row.resource_id) + '" type="button">Remove</button></article>').join('');
    container.querySelectorAll('.remove-resource').forEach(button => button.addEventListener('click', () => removeResource(button.dataset.resourceId)));
  }
  async function loadStudyResources() {
    const list = document.getElementById('resource-list'); if (!list) return;
    const client = getSupabaseClient(); if (!client) { list.textContent = 'Database connection unavailable.'; return; }
    list.textContent = 'Loading published study resources...';
    try {
      const { data, error } = await client.from('learning_resources').select('id,title,description,subject,resource_type,content,file_url').eq('published', true).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || !data.length) { list.textContent = 'No published study resources are available yet.'; return; }
      list.innerHTML = data.map(resource => '<article class="resource-card" data-subject="' + escapeHTML(String(resource.subject || 'other').toLowerCase()) + '"><div class="resource-type">' + escapeHTML(resource.resource_type || 'RESOURCE') + '</div><div class="resource-info"><p class="eyebrow">' + escapeHTML(String(resource.subject || 'GENERAL').toUpperCase()) + '</p><h2>' + escapeHTML(resource.title) + '</h2><p>' + escapeHTML(resource.description || 'Study material') + '</p>' + (resource.content ? '<details><summary>Read resource</summary><p>' + escapeHTML(resource.content).replace(/\n/g, '<br>') + '</p></details>' : '') + (resource.file_url ? '<p><a class="text-link" href="' + escapeHTML(resource.file_url) + '" target="_blank" rel="noopener">Open attached material</a></p>' : '') + '</div><button class="button button-outline save-resource" type="button" data-resource-id="' + escapeHTML(resource.id) + '" data-resource-title="' + escapeHTML(resource.title) + '">Save resource</button></article>').join('');
      list.querySelectorAll('.save-resource').forEach(button => button.addEventListener('click', async () => {
        button.disabled = true; try { const result = await saveResource(button.dataset.resourceId, button.dataset.resourceTitle); if (!result.success) { window.alert(result.message); window.location.assign('login.html'); } else window.alert(result.alreadySaved ? 'Already saved.' : 'Resource saved to your account.'); } catch (e) { console.error(e); window.alert('Could not save resource. Please try again.'); } finally { button.disabled = false; }
      })); updateSaveButtons(); setupResourceFilters();
    } catch (error) { console.error(error); list.textContent = 'Could not load study resources. Refresh and try again.'; }
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

  async function setupResourceAuth() {
    if (!document.getElementById("resource-list")) return;
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      currentUser = data.user || null;
      if (currentUser) await loadUserProgress();
    } catch (error) {
      console.error("Resource account check error:", error);
    }
  }

  /* SHARED NAVIGATION AUTHENTICATION */
  async function setupNavigationAuth() {
    const actions = document.querySelector(".header-actions");
    if (!actions || document.getElementById("logout-button")) return;
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      if (!data.user) return;
      currentUser = data.user;
      const displayName = data.user.user_metadata?.full_name || data.user.email || "Learner";
      actions.innerHTML = '<span class="nav-user-label">Signed in as ' + escapeHTML(displayName) + '</span><a class="button button-outline" href="dashboard.html">My Learning</a><button class="button button-primary" id="nav-logout-button" type="button">Log out</button>';
      document.getElementById("nav-logout-button")?.addEventListener("click", async () => {
        const button = document.getElementById("nav-logout-button");
        button.disabled = true;
        const { error: logoutError } = await client.auth.signOut();
        if (logoutError) {
          console.error("Navigation logout error:", logoutError);
          button.disabled = false;
          return;
        }
        window.location.assign("login.html");
      });
    } catch (error) {
      console.error("Navigation authentication check error:", error);
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
      currentUser = user;
      await loadUserProgress();
      renderDashboard();
      updateSaveButtons();
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
    await setupNavigationAuth();
    await setupResourceAuth();
    await loadStudyResources();
    setupClassroomForm();
    setupRegistration();
    setupLogin();

    await setupDashboardAuth();
    if (currentUser) { try { await loadUserProgress(); renderDashboard(); updateSaveButtons(); } catch (error) { console.error(error); } }
  }

  return {
    init,
    saveResource,
    removeResource,
    loadStudyResources,
    renderDashboard,
    getSupabaseClient,
    setupDashboardAuth
  };
})();

/* MAKE THE APPLICATION AVAILABLE FOR DEBUGGING */

window.LearnHoliday = LearnHoliday;

document.addEventListener("DOMContentLoaded", LearnHoliday.init);
