(() => {
  "use strict";

  const API = "/api";
  const app = document.getElementById("app");
  const state = { route: "/", employees: [], departments: [], filters: { search: "", department: "", status: "", sortBy: "name", direction: "asc" }, deleteTarget: null, loading: false };

  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.3-3.5 2.7-5.5 6.5-5.5s6.2 2 6.5 5.5M16 5.2a3.5 3.5 0 0 1 0 6.7M17 14.8c2.7.5 4.2 2.2 4.5 5.2"/></svg>',
    department: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 8h3v3H8zM14 8h3M14 11h3M8 15h9M12 20v-4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></svg>',
    dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v20m5-16H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2.8 20h18.4L12 3z"/><path d="M12 9v5m0 3h.01"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/></svg>'
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
    });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        message = body.message || body.error || message;
      } catch (_) {}
      throw new Error(message);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  function go(path) {
    history.pushState({}, "", path);
    state.route = path;
    closeMobileNav();
    render();
  }

  window.addEventListener("popstate", () => {
    state.route = location.pathname;
    render();
  });

  function currentPage() {
    if (state.route === "/") return "dashboard";
    if (state.route === "/employees/new") return "new";
    if (state.route.startsWith("/employees/") && state.route !== "/employees/new") return "edit";
    if (state.route === "/employees") return "employees";
    if (state.route === "/departments") return "departments";
    return "dashboard";
  }

  function layout(content, page) {
    const pageTitles = { dashboard: "Dashboard", employees: "All Employees", new: "Add Employee", edit: "Edit Employee", departments: "Departments" };
    const date = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date());
    return `<div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="brand-mark">${icons.people}</div><div class="brand-copy"><div class="brand-name">PeopleDesk</div><div class="brand-caption">EMPLOYEE MANAGEMENT</div></div></div>
        <div class="nav-label">Workspace</div>
        <nav class="nav-list" aria-label="Main navigation">
          ${navItem("/", "dashboard", "Dashboard", page)}
          ${navItem("/employees", "people", "All Employees", page)}
          ${navItem("/employees/new", "plus", "Add Employee", page)}
          ${navItem("/departments", "department", "Departments", page)}
        </nav>
        <div class="sidebar-bottom"><span class="online-dot"></span>Connected to employee API</div>
      </aside>
      <div class="mobile-overlay" id="mobile-overlay"></div>
      <main class="main-area">
        <header class="topbar">
          <div class="topbar-title"><button class="mobile-menu" id="mobile-menu" aria-label="Open navigation">${icons.menu}</button>${pageTitles[page]}</div>
          <div class="topbar-right"><span class="topbar-date">${date}</span><div class="user-chip"><div class="avatar">AD</div><div class="user-meta"><strong>Administrator</strong><span>People operations</span></div></div></div>
        </header>
        ${content}
      </main>
    </div>${state.deleteTarget ? deleteModal(state.deleteTarget) : ""}`;
  }

  function navItem(href, icon, label, page) {
    const active = (href === "/" && page === "dashboard") || (href === "/employees" && (page === "employees" || page === "edit")) || (href === "/employees/new" && page === "new") || (href === "/departments" && page === "departments");
    return `<a class="nav-link${active ? " active" : ""}" href="${href}" data-link>${icons[icon]}<span>${label}</span></a>`;
  }

  function heading(eyebrow, title, copy, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="heading-copy">${copy}</p></div>${action}</div>`;
  }

  function statCard(label, value, note, icon) {
    return `<article class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon">${icons[icon]}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`;
  }

  function money(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }

  function formatDate(date) {
    if (!date) return "—";
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? escapeHtml(date) : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(parsed);
  }

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
  }

  function employeeNameCell(employee) {
    return `<div class="employee-cell"><div class="employee-initial">${escapeHtml(initials(employee.name))}</div><div><div class="employee-name">${escapeHtml(employee.name)}</div><div class="employee-email">${escapeHtml(employee.email)}</div></div></div>`;
  }

  function statusBadge(status) {
    const active = status === "ACTIVE";
    return `<span class="badge ${active ? "badge-active" : "badge-inactive"}">${active ? "Active" : "Inactive"}</span>`;
  }

  function employeeActions(employee) {
    return `<div class="table-actions"><button class="icon-button" aria-label="Edit ${escapeHtml(employee.name)}" title="Edit" data-edit="${encodeURIComponent(employee.id)}">${icons.edit}</button><button class="icon-button delete" aria-label="Delete ${escapeHtml(employee.name)}" title="Delete" data-delete="${encodeURIComponent(employee.id)}">${icons.trash}</button></div>`;
  }

  function employeeTable(employees, options = {}) {
    const rows = employees.map(employee => {
      const details = options.dashboard
        ? `<td>${escapeHtml(employee.designation)}</td><td>${escapeHtml(employee.department)}</td><td>${statusBadge(employee.status)}</td>`
        : `<td>${escapeHtml(employee.designation)}</td><td>${escapeHtml(employee.department)}</td><td>${statusBadge(employee.status)}</td><td>${formatDate(employee.joiningDate)}</td><td>${money(employee.salary)}</td>`;
      return `<tr><td>${employeeNameCell(employee)}</td>${details}${options.actions === false ? "" : `<td>${employeeActions(employee)}</td>`}</tr>`;
    }).join("");
    const columns = options.dashboard
      ? "<th>Employee</th><th>Designation</th><th>Department</th><th>Status</th>"
      : `<th>Employee</th><th>Designation</th><th>Department</th><th>Status</th><th>Joining date</th><th>Salary</th>${options.actions === false ? "" : "<th>Actions</th>"}`;
    const cards = employees.map(employee => `<article class="employee-card"><div class="employee-card-top">${employeeNameCell(employee)}${statusBadge(employee.status)}</div>
      <div class="employee-card-details"><div><strong>Role</strong>${escapeHtml(employee.designation)}</div><div><strong>Department</strong>${escapeHtml(employee.department)}</div><div><strong>Joined</strong>${formatDate(employee.joiningDate)}</div><div><strong>Salary</strong>${money(employee.salary)}</div></div>
      ${options.actions === false ? "" : `<div class="employee-card-actions">${employeeActions(employee)}</div>`}
    </article>`).join("");
    return `<div class="table-wrap${options.dashboard ? " dashboard-table-wrap" : ""}"><table><thead><tr>${columns}</tr></thead><tbody>${rows}</tbody></table></div><div class="mobile-cards">${cards}</div>`;
  }

  function statePanel(title, copy, mode = "empty", action = "") {
    const icon = mode === "error" ? icons.warning : icons.empty;
    return `<div class="state"><div class="state-mark">${icon}</div><h3>${title}</h3><p>${copy}</p>${action}</div>`;
  }

  function skeletonRows(count = 4) {
    return Array.from({ length: count }, () => `<div class="skeleton-row"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`).join("");
  }

  async function renderDashboard() {
    app.innerHTML = layout(`<section class="content">
      ${heading("Overview", "Good day, Administrator", "A clear view of your people and the work happening across the team.", `<button class="button button-primary" data-href="/employees/new">${icons.plus} Add employee</button>`)}
      <div class="stats-grid" id="dashboard-stats">${[1, 2, 3, 4].map(() => `<div class="stat-card"><div class="skeleton" style="height:12px;width:90px"></div><div class="skeleton" style="height:27px;width:120px;margin-top:18px"></div></div>`).join("")}</div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Recently added</h2><p class="panel-subtitle">The latest employee records</p></div><a class="text-link" href="/employees" data-link>View all employees →</a></div><div id="recent-employees">${skeletonRows()}</div></section>
        <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Departments</h2><p class="panel-subtitle">Team size by department</p></div><a class="text-link" href="/departments" data-link>Explore →</a></div><div id="dashboard-departments">${skeletonRows(3)}</div></section>
      </div>
    </section>`, "dashboard");
    const statsTarget = document.getElementById("dashboard-stats");
    const recentTarget = document.getElementById("recent-employees");
    const departmentsTarget = document.getElementById("dashboard-departments");
    try {
      const [stats, employees, departments] = await Promise.all([
        request("/dashboard/stats"),
        request("/employees?sortBy=joiningDate&direction=desc"),
        request("/departments")
      ]);
      if (currentPage() !== "dashboard") return;
      statsTarget.innerHTML = [
        statCard("Total employees", Number(stats.totalEmployees).toLocaleString(), "People in your organization", "people"),
        statCard("Active employees", Number(stats.activeEmployees).toLocaleString(), "Currently on the team", "dashboard"),
        statCard("Departments", Number(stats.totalDepartments).toLocaleString(), "Active areas of work", "department"),
        statCard("Average monthly salary", money(stats.averageSalary), "Across all employees", "dollar")
      ].join("");
      const recent = employees.slice(0, 5);
      recentTarget.innerHTML = recent.length ? employeeTable(recent, { actions: false, dashboard: true }) : statePanel("No employee records yet", "Add your first employee to see the team taking shape.", "empty", '<button class="button button-primary button-small" data-href="/employees/new">Add employee</button>');
      state.departments = departments;
      departmentsTarget.innerHTML = departments.length ? `<div class="department-list">${departments.slice(0, 6).map(department => `<div class="department-row"><div class="department-info"><span class="department-mark"></span><div><div class="department-name">${escapeHtml(department.name)}</div><div class="department-count">People in department</div></div></div><span class="count-pill">${Number(department.employeeCount)}</span></div>`).join("")}</div>` : statePanel("No departments yet", "Department totals will appear when employee records are added.");
    } catch (error) {
      statsTarget.innerHTML = `<div class="panel" style="grid-column:1/-1">${statePanel("Could not load dashboard", error.message, "error", '<button class="button button-secondary button-small" data-retry="dashboard">Try again</button>')}</div>`;
      recentTarget.innerHTML = "";
      departmentsTarget.innerHTML = "";
    }
  }

  async function renderEmployees() {
    const action = `<button class="button button-secondary" data-export>${icons.download} Export report</button><button class="button button-primary" data-href="/employees/new">${icons.plus} Add employee</button>`;
    app.innerHTML = layout(`<section class="content">
      ${heading("People", "All Employees", "Search, filter, and maintain your employee directory.", action)}
      <section class="panel">
        <div class="filters">
          <label class="search-box">${icons.search}<input class="field-control" id="employee-search" type="search" placeholder="Search name or ID" value="${escapeHtml(state.filters.search)}" aria-label="Search employees"></label>
          <select class="field-control" id="department-filter" aria-label="Filter by department"><option value="">All departments</option>${state.departments.map(department => `<option value="${escapeHtml(department.name)}" ${state.filters.department === department.name ? "selected" : ""}>${escapeHtml(department.name)}</option>`).join("")}</select>
          <select class="field-control" id="status-filter" aria-label="Filter by status"><option value="">All statuses</option><option value="ACTIVE" ${state.filters.status === "ACTIVE" ? "selected" : ""}>Active</option><option value="INACTIVE" ${state.filters.status === "INACTIVE" ? "selected" : ""}>Inactive</option></select>
          <select class="field-control" id="sort-filter" aria-label="Sort employees"><option value="name:asc">Name (A–Z)</option><option value="name:desc">Name (Z–A)</option><option value="joiningDate:desc">Newest joined</option><option value="joiningDate:asc">Oldest joined</option></select>
        </div>
        <div class="results-line"><span id="result-count">Loading employees…</span><span>Employee directory</span></div>
        <div id="employee-results">${skeletonRows(5)}</div>
      </section>
    </section>`, "employees");
    document.getElementById("sort-filter").value = `${state.filters.sortBy}:${state.filters.direction}`;
    await loadEmployees();
  }

  async function loadEmployees() {
    const target = document.getElementById("employee-results");
    const count = document.getElementById("result-count");
    if (!target) return;
    target.innerHTML = skeletonRows(4);
    if (count) count.textContent = "Loading employees…";
    const params = new URLSearchParams();
    Object.entries(state.filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    try {
      const employees = await request(`/employees?${params.toString()}`);
      if (currentPage() !== "employees" || !document.getElementById("employee-results")) return;
      state.employees = employees;
      if (count) count.textContent = `${employees.length} ${employees.length === 1 ? "employee" : "employees"} found`;
      target.innerHTML = employees.length ? employeeTable(employees) : statePanel("No employees found", state.filters.search || state.filters.department || state.filters.status ? "Try changing your search or filters." : "Your employee directory is ready for its first record.", "empty", '<button class="button button-primary button-small" data-href="/employees/new">Add employee</button>');
    } catch (error) {
      if (count) count.textContent = "Directory unavailable";
      target.innerHTML = statePanel("Could not load employees", error.message, "error", '<button class="button button-secondary button-small" data-retry="employees">Try again</button>');
    }
  }

  async function renderDepartments() {
    app.innerHTML = layout(`<section class="content">
      ${heading("Organization", "Departments", "See how the organization is distributed across teams.", `<button class="button button-secondary" data-export>${icons.download} Export report</button>`)}
      <div class="notice">${icons.briefcase}<span>Departments are derived from employee records. Add or edit an employee to update team membership.</span></div>
      <div id="department-content"><div class="department-grid">${[1, 2, 3, 4, 5, 6].map(() => `<div class="department-card"><div class="skeleton" style="width:39px;height:39px"></div><div class="skeleton" style="width:130px;height:16px;margin-top:18px"></div><div class="skeleton" style="width:90px;height:10px;margin-top:9px"></div></div>`).join("")}</div></div>
    </section>`, "departments");
    try {
      const departments = await request("/departments");
      if (currentPage() !== "departments") return;
      state.departments = departments;
      const target = document.getElementById("department-content");
      if (!departments.length) {
        target.innerHTML = `<section class="panel">${statePanel("No departments to show", "Departments appear here when employees are assigned to them.", "empty", '<button class="button button-primary button-small" data-href="/employees/new">Add employee</button>')}</section>`;
        return;
      }
      const largest = Math.max(...departments.map(item => Number(item.employeeCount)), 1);
      target.innerHTML = `<div class="department-grid">${departments.map((department, index) => `<article class="department-card"><div class="dept-topline"><div class="dept-symbol">${escapeHtml(department.name.trim().slice(0, 2).toUpperCase())}</div><span class="dept-card-count">${Number(department.employeeCount)} ${Number(department.employeeCount) === 1 ? "employee" : "employees"}</span></div><h3>${escapeHtml(department.name)}</h3><p>Team overview</p><div class="dept-progress"><span style="width:${Math.max(7, Number(department.employeeCount) / largest * 100)}%"></span></div></article>`).join("")}</div>`;
    } catch (error) {
      document.getElementById("department-content").innerHTML = `<section class="panel">${statePanel("Could not load departments", error.message, "error", '<button class="button button-secondary button-small" data-retry="departments">Try again</button>')}</section>`;
    }
  }

  function formMarkup(employee = null, loadError = "") {
    const editing = Boolean(employee);
    const fields = [
      ["name", "Full name", employee?.name || "", "text", "e.g. Sam Rivera", 100],
      ["email", "Work email", employee?.email || "", "email", "name@company.com", 150],
      ["phone", "Phone number", employee?.phone || "", "tel", "+1 555 010 2040", 20],
      ["department", "Department", employee?.department || "", "text", "e.g. Engineering", 100],
      ["designation", "Job title", employee?.designation || "", "text", "e.g. Software Engineer", 100],
      ["salary", "Monthly salary", employee?.salary ?? "", "number", "e.g. 7200.00", null],
      ["joiningDate", "Joining date", employee?.joiningDate || "", "date", "", null]
    ];
    return `<section class="content">
      ${heading("People", editing ? "Edit Employee" : "Add Employee", editing ? "Update this employee's details and team information." : "Create a clear, complete employee record.", `<a href="/employees" class="button button-secondary" data-link>Back to directory</a>`)}
      ${loadError ? `<section class="panel">${statePanel("Could not load employee", loadError, "error", '<button class="button button-secondary button-small" data-retry="form">Try again</button>')}</section>` : `<section class="panel form-panel">
        <div class="form-intro"><h2 class="panel-title">${editing ? "Employee details" : "New employee details"}</h2><p>Fields marked with <span style="color:#c45a5a">*</span> are required.</p></div>
        <form id="employee-form" novalidate><div class="form-body">
          <h3 class="form-section-title">Personal and role information</h3>
          <div class="form-grid">${fields.map(([name, label, value, type, placeholder, max]) => `<div class="form-field"><label for="${name}">${label} <span class="required">*</span></label><input class="form-control" id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${placeholder ? `placeholder="${placeholder}"` : ""} ${max ? `maxlength="${max}"` : ""} ${name === "salary" ? 'min="0.01" step="0.01"' : ""} required><span class="field-error" data-error="${name}"></span></div>`).join("")}
            <div class="form-field"><label for="status">Employment status <span class="required">*</span></label><select class="form-control" id="status" name="status" required><option value="ACTIVE" ${!employee || employee.status === "ACTIVE" ? "selected" : ""}>Active</option><option value="INACTIVE" ${employee?.status === "INACTIVE" ? "selected" : ""}>Inactive</option></select><span class="field-error" data-error="status"></span></div>
          </div>
          <div class="form-actions"><a href="/employees" class="button button-secondary" data-link>Cancel</a><button class="button button-primary" id="save-employee" type="submit">${editing ? "Save changes" : "Create employee"}</button></div>
        </div></form>
      </section>`}
    </section>`;
  }

  async function renderForm() {
    const editing = currentPage() === "edit";
    const id = editing ? decodeURIComponent(state.route.split("/")[2]) : null;
    app.innerHTML = layout(`<div id="form-view">${formMarkup()}</div>`, editing ? "edit" : "new");
    if (!editing) {
      bindEmployeeForm(null);
      return;
    }
    try {
      const employee = await request(`/employees/${encodeURIComponent(id)}`);
      if (currentPage() !== "edit") return;
      document.getElementById("form-view").innerHTML = formMarkup(employee);
      bindEmployeeForm(id);
    } catch (error) {
      if (currentPage() !== "edit") return;
      document.getElementById("form-view").innerHTML = formMarkup(null, error.message);
    }
  }

  function validateField(name, value) {
    const text = String(value).trim();
    if (!text) return "This field is required.";
    if (name === "name" && (text.length < 2 || text.length > 100)) return "Enter a name between 2 and 100 characters.";
    if (name === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) || text.length > 150)) return "Enter a valid email address.";
    if (name === "phone" && (text.length < 5 || text.length > 20)) return "Enter a phone number between 5 and 20 characters.";
    if (["department", "designation"].includes(name) && (text.length < 2 || text.length > 100)) return "Enter at least 2 characters (up to 100).";
    if (name === "salary" && (!Number.isFinite(Number(text)) || Number(text) < 0.01)) return "Salary must be greater than zero.";
    if (name === "joiningDate" && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(new Date(`${text}T00:00:00`).getTime()))) return "Choose a valid joining date.";
    if (name === "status" && !["ACTIVE", "INACTIVE"].includes(text)) return "Choose a valid employment status.";
    return "";
  }

  function bindEmployeeForm(id) {
    const form = document.getElementById("employee-form");
    if (!form) return;
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const fields = ["name", "email", "phone", "department", "designation", "salary", "joiningDate", "status"];
      let valid = true;
      fields.forEach(name => {
        const input = form.elements[name];
        const error = validateField(name, input.value);
        form.querySelector(`[data-error="${name}"]`).textContent = error;
        input.classList.toggle("invalid", Boolean(error));
        if (error) valid = false;
      });
      if (!valid) {
        form.querySelector(".invalid")?.focus();
        return;
      }
      const payload = Object.fromEntries(fields.map(name => [name, form.elements[name].value.trim()]));
      payload.salary = Number(payload.salary);
      const button = document.getElementById("save-employee");
      button.disabled = true;
      button.textContent = id ? "Saving changes…" : "Creating employee…";
      try {
        await request(id ? `/employees/${encodeURIComponent(id)}` : "/employees", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
        showToast(id ? "Employee updated successfully." : "Employee created successfully.");
        go("/employees");
      } catch (error) {
        showToast(error.message, true);
        button.disabled = false;
        button.textContent = id ? "Save changes" : "Create employee";
      }
    });
    form.addEventListener("input", event => {
      if (!event.target.name) return;
      const error = validateField(event.target.name, event.target.value);
      form.querySelector(`[data-error="${event.target.name}"]`).textContent = error;
      event.target.classList.toggle("invalid", Boolean(error));
    });
  }

  function deleteModal(employee) {
    return `<div class="modal-backdrop" id="delete-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div class="modal-icon">${icons.trash}</div><h2 id="delete-title">Delete employee?</h2><p>This will permanently remove <strong>${escapeHtml(employee.name)}</strong> from the employee directory. This action cannot be undone.</p><div class="modal-actions"><button class="button button-secondary" data-cancel-delete>Cancel</button><button class="button button-danger" data-confirm-delete>Delete employee</button></div></section></div>`;
  }

  async function confirmDelete() {
    const employee = state.deleteTarget;
    if (!employee) return;
    const button = document.querySelector("[data-confirm-delete]");
    button.disabled = true;
    button.textContent = "Deleting…";
    try {
      await request(`/employees/${encodeURIComponent(employee.id)}`, { method: "DELETE" });
      state.deleteTarget = null;
      render();
      showToast(`${employee.name} was removed.`);
    } catch (error) {
      state.deleteTarget = null;
      render();
      showToast(error.message, true);
    }
  }

  async function exportReport() {
    try {
      const response = await fetch(`${API}/reports/employees.csv`);
      if (!response.ok) throw new Error(`Report download failed (${response.status})`);
      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employees.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("Employee report downloaded.");
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function showToast(message, error = false) {
    const area = document.getElementById("toast-area");
    const toast = document.createElement("div");
    toast.className = `toast${error ? " error" : ""}`;
    toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;
    area.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  }

  function openMobileNav() {
    document.getElementById("sidebar")?.classList.add("open");
    document.getElementById("mobile-overlay")?.classList.add("show");
  }
  function closeMobileNav() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("mobile-overlay")?.classList.remove("show");
  }

  function bindGlobalEvents() {
    app.onclick = event => {
      const link = event.target.closest("[data-link]");
      if (link) {
        event.preventDefault();
        go(link.getAttribute("href"));
        return;
      }
      const routeButton = event.target.closest("[data-href]");
      if (routeButton) { go(routeButton.dataset.href); return; }
      const editButton = event.target.closest("[data-edit]");
      if (editButton) { go(`/employees/${decodeURIComponent(editButton.dataset.edit)}/edit`); return; }
      const deleteButton = event.target.closest("[data-delete]");
      if (deleteButton) {
        const id = decodeURIComponent(deleteButton.dataset.delete);
        const employee = state.employees.find(item => String(item.id) === String(id));
        if (employee) { state.deleteTarget = employee; render(); }
        return;
      }
      if (event.target.closest("[data-export]")) { exportReport(); return; }
      if (event.target.closest("[data-retry]")) {
        const kind = event.target.closest("[data-retry]").dataset.retry;
        if (kind === "dashboard") renderDashboard();
        else if (kind === "employees") loadEmployees();
        else if (kind === "departments") renderDepartments();
        else renderForm();
        return;
      }
      if (event.target.closest("[data-cancel-delete]")) { state.deleteTarget = null; render(); return; }
      if (event.target.closest("[data-confirm-delete]")) { confirmDelete(); return; }
      if (event.target.id === "delete-backdrop") { state.deleteTarget = null; render(); }
      if (event.target.closest("#mobile-menu")) openMobileNav();
      if (event.target.id === "mobile-overlay") closeMobileNav();
    };
    app.oninput = event => {
      if (event.target.id !== "employee-search") return;
      state.filters.search = event.target.value;
      clearTimeout(app.searchTimer);
      app.searchTimer = setTimeout(loadEmployees, 300);
    };
    app.onchange = event => {
      const target = event.target;
      if (target.id === "department-filter") state.filters.department = target.value;
      else if (target.id === "status-filter") state.filters.status = target.value;
      else if (target.id === "sort-filter") {
        const [sortBy, direction] = target.value.split(":");
        state.filters.sortBy = sortBy;
        state.filters.direction = direction;
      } else return;
      loadEmployees();
    };
  }

  async function render() {
    const page = currentPage();
    if (page === "dashboard") await renderDashboard();
    else if (page === "employees") {
      if (!state.departments.length) {
        try { state.departments = await request("/departments"); } catch (_) { state.departments = []; }
      }
      await renderEmployees();
    } else if (page === "departments") await renderDepartments();
    else await renderForm();
  }

  bindGlobalEvents();
  state.route = location.pathname;
  render();
})();
