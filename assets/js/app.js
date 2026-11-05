
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

  /* DATABASE-DRIVEN COURSES */

  async function loadCourses() {
    const list = document.getElementById("course-list");
    if (!list) return;

    const client = getSupabaseClient();
    if (!client) {
      list.innerHTML = '<p class="small-note">Courses are temporarily unavailable. Please refresh and try again.</p>';
      return;
    }

    list.innerHTML = '<p class="small-note">Loading published courses...</p>';

    try {
      const { data, error } = await client
        .from("courses")
        .select("id,title,description,subject,learning_level")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        list.innerHTML = '<p class="small-note">No courses have been published yet. Please check back soon.</p>';
        return;
      }

      const banners = ["banner-cyan", "banner-purple", "banner-blue", "banner-dark"];
      list.innerHTML = data.map((course, index) => {
        const subject = String(course.subject || "General");
        const subjectKey = subject.toLowerCase();
        const banner = banners[index % banners.length];

        return '<article class="course-card" data-subject="' + escapeHTML(subjectKey) + '">' +
          '<div class="course-banner ' + banner + '">' + escapeHTML(subject.toUpperCase()) + '</div>' +
          '<div class="course-body">' +
          '<p class="eyebrow">' + escapeHTML(course.learning_level || "ALL LEVELS") + '</p>' +
          '<h2>' + escapeHTML(course.title) + '</h2>' +
          '<p>' + escapeHTML(course.description || "Explore this course and build your knowledge.") + '</p>' +
          '<a class="button button-primary" href="course.html?id=' + encodeURIComponent(course.id) + '">Open course</a>' +
          '</div></article>';
      }).join("");

      const filter = document.getElementById("course-filter");
      if (filter) {
        const subjects = [...new Set(data.map(course => String(course.subject || "General")))]
          .sort((a, b) => a.localeCompare(b));
        filter.innerHTML = '<option value="all">All subjects</option>' +
          subjects.map(subject => '<option value="' + escapeHTML(subject.toLowerCase()) + '">' +
            escapeHTML(subject) + '</option>').join("");
      }

      setupCourseFilters();
    } catch (error) {
      console.error("Course loading error:", error);
      list.innerHTML = '<p class="small-note">We could not load courses. Please refresh the page and try again.</p>';
    }
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
      const emailName = data.user.email ? data.user.email.split("@")[0] : "Learner";
      const displayName = data.user.user_metadata?.full_name || emailName;
      actions.innerHTML = '<span class="nav-user-label">' + escapeHTML(displayName) + '</span><button class="button button-primary" id="nav-logout-button" type="button">Log out</button>';
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
      await loadLearningOverview();
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

  /* COURSE-BY-COURSE LEARNING OVERVIEW */
  async function loadLearningOverview() {
    const container = document.getElementById("course-progress-list");
    const totalNode = document.getElementById("lessons-completed-total");
    const overallNode = document.getElementById("overall-progress");
    if (!container || !currentUser) return;
    container.textContent = "Loading your course progress...";
    try {
      const client = getSupabaseClient();
      const { data: courses, error: courseError } = await client
        .from("courses").select("id,title,subject").eq("published", true)
        .order("created_at", { ascending: false });
      if (courseError) throw courseError;
      const { data: lessons, error: lessonError } = await client
        .from("course_lessons").select("id,course_id,title,lesson_order")
        .eq("published", true).order("lesson_order", { ascending: true });
      if (lessonError) throw lessonError;
      const { data: progress, error: progressError } = await client
        .from("lesson_progress").select("lesson_id,is_completed")
        .eq("user_id", currentUser.id);
      if (progressError) throw progressError;

      const completedIds = new Set((progress || []).filter(row => row.is_completed).map(row => row.lesson_id));
      const allLessons = lessons || [];
      const completedTotal = allLessons.filter(lesson => completedIds.has(lesson.id)).length;
      const overall = allLessons.length ? Math.round(completedTotal / allLessons.length * 100) : 0;
      if (totalNode) totalNode.textContent = completedTotal + " / " + allLessons.length;
      if (overallNode) overallNode.textContent = overall + "%";
      if (!courses || !courses.length) {
        container.textContent = "No published courses are available yet.";
        return;
      }
      container.innerHTML = courses.map(course => {
        const courseLessons = allLessons.filter(lesson => lesson.course_id === course.id);
        const done = courseLessons.filter(lesson => completedIds.has(lesson.id)).length;
        const percent = courseLessons.length ? Math.round(done / courseLessons.length * 100) : 0;
        const next = courseLessons.find(lesson => !completedIds.has(lesson.id));
        const action = next
          ? '<a class="button button-primary" href="lesson.html?id=' + encodeURIComponent(next.id) + '">Continue: ' + escapeHTML(next.title) + '</a>'
          : (courseLessons.length ? '<span class="progress-finished">All lessons completed ✓</span>' : '<span class="small-note">Lessons coming soon</span>');
        return '<article class="course-progress-card"><div class="course-progress-top"><div><p class="eyebrow">' + escapeHTML(course.subject || "COURSE") + '</p><h3>' + escapeHTML(course.title) + '</h3></div><strong>' + percent + '%</strong></div><div class="progress-track" role="progressbar" aria-label="' + escapeHTML(course.title) + ' progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '"><span style="width:' + percent + '%"></span></div><p class="progress-caption">' + done + ' of ' + courseLessons.length + ' lessons completed</p><div class="course-progress-action">' + action + '</div></article>';
      }).join("");
    } catch (error) {
      console.error("Learning overview error:", error);
      container.textContent = "We could not load your course progress. Please refresh and try again.";
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


  /* COURSE AND LESSON PAGES */
  function pageParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  async function setupCoursePage() {
    const root = document.getElementById("course-detail");
    if (!root) return;
    const id = pageParam("id");
    if (!id) { root.textContent = "No course was selected. Return to Courses and choose a course."; return; }
    const client = getSupabaseClient();
    if (!client) { root.textContent = "Course service is unavailable. Refresh and try again."; return; }
    root.textContent = "Loading course...";
    try {
      const [{ data: course, error: courseError }, { data: lessons, error: lessonError }] = await Promise.all([
        client.from("courses").select("id,title,description,subject,learning_level").eq("id", id).eq("published", true).single(),
        client.from("course_lessons").select("id,title,summary,lesson_order").eq("course_id", id).eq("published", true).order("lesson_order")
      ]);
      if (courseError) throw courseError;
      if (lessonError) throw lessonError;
      root.innerHTML = '<p class="eyebrow">' + escapeHTML(course.subject || "COURSE") + ' · ' + escapeHTML(course.learning_level || "ALL LEVELS") + '</p>' +
        '<h1>' + escapeHTML(course.title) + '</h1><p>' + escapeHTML(course.description || "") + '</p>' +
        '<h2>Course lessons</h2>' +
        (lessons && lessons.length ? '<div class="resource-list">' + lessons.map(lesson =>
          '<article class="resource-card"><div class="resource-info"><p class="eyebrow">LESSON ' + lesson.lesson_order + '</p><h2>' + escapeHTML(lesson.title) + '</h2><p>' + escapeHTML(lesson.summary || "") + '</p><a class="button button-primary" href="lesson.html?id=' + encodeURIComponent(lesson.id) + '">Open lesson</a></div></article>'
        ).join("") + '</div>' : '<p>No lessons have been published for this course yet.</p>');
    } catch (error) {
      console.error("Course page error:", error);
      root.textContent = "Could not load this course. Please refresh and try again.";
    }
  }

  async function setupLessonPage() {
    const root = document.getElementById("lesson-detail");
    if (!root) return;
    const id = pageParam("id");
    if (!id) { root.textContent = "No lesson was selected. Return to the course page."; return; }
    const client = getSupabaseClient();
    if (!client) { root.textContent = "Lesson service is unavailable. Refresh and try again."; return; }
    root.textContent = "Loading lesson...";
    try {
      const { data: lesson, error } = await client.from("course_lessons")
        .select("id,title,summary,content,lesson_order,course_id,courses(title),learning_objectives,explanation,worked_example,practice_task,expected_result,learner_exercise,key_takeaways")
        .eq("id", id).eq("published", true).single();
      if (error) throw error;
      const { data: authData } = await client.auth.getUser();
      currentUser = authData.user || null;
      let completed = false;
      if (currentUser) {
        const { data: progress, error: progressError } = await client.from("lesson_progress")
          .select("is_completed").eq("user_id", currentUser.id).eq("lesson_id", id).maybeSingle();
        if (progressError) throw progressError;
        completed = Boolean(progress && progress.is_completed);
      }
      const courseName = lesson.courses && lesson.courses.title ? lesson.courses.title : "Course";
      root.innerHTML = '<p class="eyebrow">' + escapeHTML(courseName) + ' · LESSON ' + lesson.lesson_order + '</p>' +
        '<h1>' + escapeHTML(lesson.title) + '</h1><p>' + escapeHTML(lesson.summary || "") + '</p>' +
        '<article class="resource-card"><div class="resource-info lesson-content"></div></article>' +
        '<div class="lesson-actions">' +
        (currentUser ? '<button class="button button-primary" id="lesson-complete" type="button">' + (completed ? 'Completed ✓' : 'Mark as completed') + '</button>' : '<p><a href="login.html">Log in</a> to save your lesson progress.</p>') +
        '<a class="button button-outline" href="course.html?id=' + encodeURIComponent(lesson.course_id) + '">Back to course</a></div>' +
        '<p id="lesson-message" role="status"></p>';
      const content = root.querySelector(".lesson-content");
      const addSection = (heading, body, className) => {
        const section = document.createElement("section");
        section.className = "lesson-section " + (className || "");
        const h = document.createElement("h2");
        h.textContent = heading;
        section.appendChild(h);
        if (Array.isArray(body)) {
          const list = document.createElement("ul");
          body.forEach(item => { const li = document.createElement("li"); li.textContent = item; list.appendChild(li); });
          section.appendChild(list);
        } else {
          const p = document.createElement("p");
          p.textContent = body || "";
          section.appendChild(p);
        }
        content.appendChild(section);
      };
      addSection("1. Learning objectives", lesson.learning_objectives || []);
      addSection("2. Introduction and explanation", lesson.explanation || lesson.content);
      const example = document.createElement("section");
      example.className = "lesson-section";
      const exampleTitle = document.createElement("h2");
      exampleTitle.textContent = "3. Worked example";
      const pre = document.createElement("pre");
      pre.className = "lesson-code-example";
      pre.textContent = lesson.worked_example || lesson.content;
      example.append(exampleTitle, pre);
      content.appendChild(example);
      addSection("4. Guided practice", lesson.practice_task);
      addSection("5. Expected result", lesson.expected_result);
      addSection("6. Your exercise", lesson.learner_exercise);
      addSection("7. Key takeaways", lesson.key_takeaways || []);

      // Interactive coding workspace for programming lessons.
      const courseLower = courseName.toLowerCase();
      if (courseLower.includes("html") || courseLower.includes("css") || courseLower.includes("javascript")) {
        const workspace = document.createElement("section");
        workspace.className = "practice-workspace resource-card";
        workspace.innerHTML = '<div class="resource-info"><p class="eyebrow">HANDS-ON PRACTICE</p><h2>Practice in LearnHoliday</h2><p>Make changes to the code and run it to see what happens. Your work runs in an isolated preview.</p><div class="practice-editor-grid">' +
          '<label class="practice-field"><span>HTML</span><textarea id="practice-html" spellcheck="false" rows="10"><h1>Hello, LearnHoliday!</h1>\n<p>I am practising web development.</p>\n<button>Click me</button></textarea></label>' +
          '<label class="practice-field"><span>CSS</span><textarea id="practice-css" spellcheck="false" rows="10">body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #f2f0ff;\n}\nh1 { color: #5145cd; }</textarea></label></div>' +
          '<div class="practice-controls"><button class="button button-primary" id="run-web-practice" type="button">Run HTML &amp; CSS</button><button class="button button-outline" id="reset-web-practice" type="button">Reset example</button></div>' +
          '<h3>Live preview</h3><iframe id="web-practice-preview" title="HTML and CSS practice preview" sandbox=""></iframe>' +
          '<div class="js-practice-area"><h3>JavaScript practice</h3><label class="practice-field"><span>JavaScript code</span><textarea id="practice-js" spellcheck="false" rows="8">console.log("Hello from JavaScript!");\nconsole.log(2 + 3);</textarea></label>' +
          '<div class="practice-controls"><button class="button button-primary" id="run-js-practice" type="button">Run JavaScript</button><button class="button button-outline" id="clear-js-output" type="button">Clear output</button></div>' +
          '<pre id="js-practice-output" class="practice-output" aria-live="polite">Your JavaScript output will appear here.</pre></div></div>';
        root.insertBefore(workspace, root.querySelector(".lesson-quiz") || root.querySelector(".lesson-actions"));
        const htmlEditor = workspace.querySelector("#practice-html");
        const cssEditor = workspace.querySelector("#practice-css");
        const preview = workspace.querySelector("#web-practice-preview");
        const runWeb = () => {
          preview.srcdoc = "<!doctype html><html><head><meta charset='utf-8'><style>" +
            cssEditor.value +
            "</style></head><body>" + htmlEditor.value + "</body></html>";
        };
        workspace.querySelector("#run-web-practice").addEventListener("click", runWeb);
        workspace.querySelector("#reset-web-practice").addEventListener("click", () => {
          htmlEditor.value = "<h1>Hello, LearnHoliday!</h1>\\n<p>I am practising web development.</p>\\n<button>Click me</button>";
          cssEditor.value = "body {\\n  font-family: Arial, sans-serif;\\n  padding: 24px;\\n  background: #f2f0ff;\\n}\\nh1 { color: #5145cd; }";
          runWeb();
        });
        runWeb();

        const jsArea = workspace.querySelector(".js-practice-area");
        if (courseLower.includes("javascript")) {
          const output = workspace.querySelector("#js-practice-output");
          const jsEditor = workspace.querySelector("#practice-js");
          workspace.querySelector("#run-js-practice").addEventListener("click", () => {
            const safeCode = JSON.stringify(jsEditor.value).replace(/</g, "\\\\u003c");
            const frame = document.createElement("iframe");
            frame.setAttribute("sandbox", "allow-scripts");
            frame.title = "Isolated JavaScript practice runner";
            frame.className = "js-runner-frame";
            frame.srcdoc = "<!doctype html><meta charset='utf-8'><script>" +
              "const send=(type,value)=>parent.postMessage({learnHolidayPractice:true,type,value:String(value)},'*');" +
              "console.log=(...args)=>send('log',args.join(' '));" +
              "console.error=(...args)=>send('error',args.join(' '));" +
              "try { (new Function(" + safeCode + "))(); } catch(error) { send('error',error.message); }" +
              "<\\/script>";
            const oldFrame = workspace.querySelector(".js-runner-frame");
            if (oldFrame) oldFrame.remove();
            workspace.appendChild(frame);
            output.textContent = "Running...";
            const receiveOutput = event => {
              if (event.source !== frame.contentWindow || !event.data || !event.data.learnHolidayPractice) return;
              output.textContent = (output.textContent === "Running..." ? "" : output.textContent + "\\n") +
                (event.data.type === "error" ? "Error: " : "") + event.data.value;
            };
            window.addEventListener("message", receiveOutput);
            frame.addEventListener("load", () => {
              window.removeEventListener("message", receiveOutput);
              window.addEventListener("message", receiveOutput);
            }, { once: true });
          });
          workspace.querySelector("#clear-js-output").addEventListener("click", () => { output.textContent = ""; });
        } else {
          jsArea.remove();
        }
      }

      // Subject-appropriate practice for mathematics and computer basics.
      if (courseLower.includes("mathematics")) {
        const titleLower = lesson.title.toLowerCase();
        let prompt = "Calculate 25% of 200.";
        let answer = "50";
        let hint = "25% means 25 out of 100, or one quarter. Divide 200 by 4.";
        if (titleLower.includes("fraction")) {
          prompt = "Which fraction is equivalent to 1/2: 2/4, 2/3 or 3/4?";
          answer = "2/4";
          hint = "Multiply the numerator and denominator of 1/2 by the same number.";
        } else if (titleLower.includes("algebra")) {
          prompt = "Solve for x: x + 5 = 12.";
          answer = "7";
          hint = "Subtract 5 from both sides of the equation.";
        }
        const practice = document.createElement("section");
        practice.className = "practice-workspace resource-card";
        practice.innerHTML = '<div class="resource-info"><p class="eyebrow">MATHEMATICS PRACTICE</p><h2>Try it yourself</h2><p class="math-practice-question"></p><label class="practice-field"><span>Your answer</span><input id="math-practice-answer" type="text" autocomplete="off" placeholder="Enter your answer"></label><div class="practice-controls"><button class="button button-primary" id="check-math-answer" type="button">Check answer</button><button class="button button-outline" id="show-math-hint" type="button">Show hint</button></div><p id="math-practice-feedback" role="status" aria-live="polite"></p></div>';
        practice.querySelector(".math-practice-question").textContent = prompt;
        root.insertBefore(practice, root.querySelector(".lesson-quiz") || root.querySelector(".lesson-actions"));
        practice.querySelector("#check-math-answer").addEventListener("click", () => {
          const entered = practice.querySelector("#math-practice-answer").value.trim().toLowerCase().replace(/\\s+/g, "");
          const expected = answer.toLowerCase().replace(/\\s+/g, "");
          const feedback = practice.querySelector("#math-practice-feedback");
          feedback.textContent = entered === expected ? "Correct! Well done. You can now try the lesson quiz." : "Not quite. Review the hint and try again.";
          feedback.className = entered === expected ? "success" : "error";
        });
        practice.querySelector("#show-math-hint").addEventListener("click", () => {
          practice.querySelector("#math-practice-feedback").textContent = hint;
          practice.querySelector("#math-practice-feedback").className = "";
        });
      } else if (courseLower.includes("computer basics")) {
        const titleLower = lesson.title.toLowerCase();
        let task = "Name one safe habit you should follow when using a shared computer.";
        let guidance = "For example, sign out of your accounts when you finish and do not share your password.";
        if (titleLower.includes("hardware")) {
          task = "A learner wants to type a document and print it. Name the input device and output device they need.";
          guidance = "Think about the device used to enter text and the device that produces a paper copy.";
        } else if (titleLower.includes("software")) {
          task = "Give one example of an operating system and explain what it helps a computer do.";
          guidance = "An operating system manages the computer's hardware and provides a platform for applications.";
        } else if (titleLower.includes("files")) {
          task = "You have finished an assignment on a shared computer. Name two steps that help keep your work and account safe.";
          guidance = "Consider where you save your work, signing out, and protecting personal information.";
        }
        const practice = document.createElement("section");
        practice.className = "practice-workspace resource-card";
        practice.innerHTML = '<div class="resource-info"><p class="eyebrow">COMPUTER SKILLS PRACTICE</p><h2>Apply what you learned</h2><p class="computer-practice-task"></p><label class="practice-field"><span>Your response</span><textarea id="computer-practice-answer" rows="4" placeholder="Write your answer here..."></textarea></label><div class="practice-controls"><button class="button button-primary" id="review-computer-answer" type="button">Review my response</button><button class="button button-outline" id="computer-practice-hint" type="button">Show learning reminder</button></div><p id="computer-practice-feedback" role="status" aria-live="polite"></p></div>';
        practice.querySelector(".computer-practice-task").textContent = task;
        root.insertBefore(practice, root.querySelector(".lesson-quiz") || root.querySelector(".lesson-actions"));
        practice.querySelector("#review-computer-answer").addEventListener("click", () => {
          const response = practice.querySelector("#computer-practice-answer").value.trim();
          const feedback = practice.querySelector("#computer-practice-feedback");
          feedback.textContent = response.length >= 8 ? "Response saved on this page for you to review. Compare your answer with the learning reminder before taking the quiz." : "Add a little more detail to explain your answer.";
          feedback.className = response.length >= 8 ? "success" : "error";
        });
        practice.querySelector("#computer-practice-hint").addEventListener("click", () => {
          practice.querySelector("#computer-practice-feedback").textContent = guidance;
          practice.querySelector("#computer-practice-feedback").className = "";
        });
      }

      // Save and restore this learner's practice work for the current lesson.
      const practiceWorkspaces = Array.from(root.querySelectorAll(".practice-workspace"));
      if (practiceWorkspaces.length) {
        const practiceFields = practiceWorkspaces.flatMap(workspace =>
          Array.from(workspace.querySelectorAll("textarea[id], input[id]"))
        );
        let savedPractice = {};
        if (currentUser) {
          const { data: savedRow, error: savedError } = await client
            .from("lesson_practice_submissions")
            .select("practice_data")
            .eq("user_id", currentUser.id)
            .eq("lesson_id", id)
            .maybeSingle();
          if (savedError) throw savedError;
          savedPractice = savedRow && savedRow.practice_data && typeof savedRow.practice_data === "object"
            ? savedRow.practice_data : {};
          practiceFields.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(savedPractice, field.id)) {
              field.value = String(savedPractice[field.id] ?? "");
            }
          });
        }

        const savePanel = document.createElement("section");
        savePanel.className = "practice-save-panel";
        savePanel.innerHTML = '<button class="button button-primary" id="save-practice-work" type="button">Save my practice work</button><p id="practice-save-message" role="status" aria-live="polite"></p>';
        root.insertBefore(savePanel, root.querySelector(".lesson-quiz") || root.querySelector(".lesson-actions"));
        if (!currentUser) {
          savePanel.querySelector("#save-practice-work").disabled = true;
          setMessage(savePanel.querySelector("#practice-save-message"), "Log in to save your practice work across devices.");
        } else {
          setMessage(savePanel.querySelector("#practice-save-message"),
            Object.keys(savedPractice).length ? "Your previously saved work has been restored." : "Your work is not saved until you select Save my practice work.");
          savePanel.querySelector("#save-practice-work").addEventListener("click", async () => {
            const saveButton = savePanel.querySelector("#save-practice-work");
            const status = savePanel.querySelector("#practice-save-message");
            saveButton.disabled = true;
            setMessage(status, "Saving your work...");
            const practiceData = {};
            practiceFields.forEach(field => { practiceData[field.id] = field.value; });
            try {
              const { error: saveError } = await client
                .from("lesson_practice_submissions")
                .upsert({
                  user_id: currentUser.id,
                  lesson_id: id,
                  practice_data: practiceData,
                  updated_at: new Date().toISOString()
                }, { onConflict: "user_id,lesson_id" });
              if (saveError) throw saveError;
              setMessage(status, "Practice work saved. It will be restored when you return to this lesson.", "success");
            } catch (saveError) {
              console.error("Practice save error:", saveError);
              setMessage(status, saveError.message || "Could not save your work. Please try again.", "error");
            } finally {
              saveButton.disabled = false;
            }
          });
        }
      }

      // Load and mark the lesson quiz
      const { data: quizQuestions, error: quizError } = await client
        .from("lesson_quiz_questions")
        .select("id,question,options,question_order")
        .eq("lesson_id", id)
        .eq("published", true)
        .order("question_order");
      if (quizError) throw quizError;

      if (quizQuestions && quizQuestions.length) {
        const quiz = document.createElement("section");
        quiz.className = "lesson-quiz resource-card";
        quiz.innerHTML = '<div class="resource-info"><p class="eyebrow">KNOWLEDGE CHECK</p><h2>Test what you learned</h2><p>Choose one answer for each question, then submit your quiz.</p><form id="lesson-quiz-form">' +
          quizQuestions.map((q, index) => '<fieldset class="quiz-question"><legend>' + (index + 1) + '. ' + escapeHTML(q.question) + '</legend>' +
            (Array.isArray(q.options) ? q.options : []).map((option, optionIndex) =>
              '<label class="quiz-option"><input type="radio" name="question-' + index + '" value="' + optionIndex + '" required> ' + escapeHTML(option) + '</label>'
            ).join("") + '</fieldset>'
          ).join("") + '<button class="button button-primary" type="submit">Submit quiz</button></form><p id="quiz-result" role="status"></p></div>';
        root.insertBefore(quiz, root.querySelector(".lesson-actions"));
        const quizForm = quiz.querySelector("#lesson-quiz-form");
        quizForm.addEventListener("submit", async event => {
          event.preventDefault();
          const submit = quizForm.querySelector('button[type="submit"]');
          submit.disabled = true;
          const answers = quizQuestions.map((q, index) => {
            const selected = quizForm.querySelector('input[name="question-' + index + '"]:checked');
            return selected ? Number(selected.value) : -1;
          });
          try {
            const { data: marked, error: markError } = await client.rpc("grade_lesson_quiz", {
              p_lesson_id: id,
              p_answers: answers
            });
            if (markError) throw markError;
            const result = Array.isArray(marked) ? marked[0] : marked;
            const score = Number(result.score);
            const total = Number(result.total_questions);
            const resultBox = quiz.querySelector("#quiz-result");
            resultBox.textContent = 'Your score: ' + score + ' out of ' + total + ' (' + Math.round(score / total * 100) + '%). ' + (score === total ? 'Excellent work!' : 'Review the lesson and try again.');
            resultBox.className = "success";

            // Automatically complete the lesson after a quiz has been successfully graded.
            if (currentUser && !completed) {
              const { error: progressSaveError } = await client.from("lesson_progress").upsert({
                user_id: currentUser.id,
                lesson_id: id,
                is_completed: true,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: "user_id,lesson_id" });
              if (progressSaveError) throw progressSaveError;
              completed = true;
              const completeButton = document.getElementById("lesson-complete");
              if (completeButton) {
                completeButton.textContent = "Completed ✓";
                completeButton.disabled = true;
              }
              setMessage(document.getElementById("lesson-message"), "Quiz submitted. Lesson automatically marked as completed.", "success");
            }
          } catch (quizSubmitError) {
            console.error("Quiz submission error:", quizSubmitError);
            setMessage(quiz.querySelector("#quiz-result"), "Could not save your quiz. Please log in and try again.", "error");
          } finally {
            submit.disabled = false;
          }
        });
      } else {
        const note = document.createElement("p");
        note.textContent = "A quiz for this lesson will be added soon.";
        root.insertBefore(note, root.querySelector(".lesson-actions"));
      }

      const completeButton = document.getElementById("lesson-complete");
      if (completeButton) completeButton.addEventListener("click", async () => {
        completeButton.disabled = true;
        try {
          const result = await client.from("lesson_progress").upsert({
            user_id: currentUser.id,
            lesson_id: id,
            is_completed: !completed,
            completed_at: !completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id,lesson_id" });
          if (result.error) throw result.error;
          completed = !completed;
          completeButton.textContent = completed ? "Completed ✓" : "Mark as completed";
          setMessage(document.getElementById("lesson-message"), completed ? "Lesson marked as completed." : "Lesson marked as not completed.", "success");
        } catch (e) {
          console.error("Lesson progress error:", e);
          setMessage(document.getElementById("lesson-message"), "Could not save progress. Please try again.", "error");
        } finally { completeButton.disabled = false; }
      });
    } catch (error) {
      console.error("Lesson page error:", error);
      root.textContent = "Could not load this lesson. Please refresh and try again.";
    }
  }

  /* STARTUP */

  async function init() {
    updateYear();
    await setupCoursePage();
    await setupLessonPage();
    setupCourseFilters();
    setupResourceFilters();
    await loadCourses();
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
    loadCourses,
    renderDashboard,
    getSupabaseClient,
    setupDashboardAuth,
    loadLearningOverview
  };
})();

/* MAKE THE APPLICATION AVAILABLE FOR DEBUGGING */

window.LearnHoliday = LearnHoliday;

document.addEventListener("DOMContentLoaded", LearnHoliday.init);
