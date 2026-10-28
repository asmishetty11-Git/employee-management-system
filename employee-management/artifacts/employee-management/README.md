# Employee Management System

A full-stack employee directory built for a Java developer portfolio. Spring Boot serves the application and REST API; the browser interface uses plain HTML, CSS, and JavaScript.

## Features

- Dashboard totals and average monthly salary calculated from database records
- Create, view, edit, and delete employee records
- Required-field, email, salary, status, and duplicate-email validation
- Search by employee name or ID; filter by department and employment status
- Sort by name or date of joining
- Department headcounts derived from employee records
- CSV report download
- Responsive layout and readable API error messages
- H2 file database for quick local development, with a MySQL 8 profile for VS Code

The first run seeds three example employees only when the database is empty. The dashboard and reports always query saved records.

## Technology

- Java 17
- Spring Boot 3.3.5
- Spring Web, Spring Data JPA / Hibernate, Jakarta Bean Validation
- MySQL 8 or H2
- Maven and Maven Wrapper
- HTML5, CSS3, vanilla JavaScript
- JUnit 5, Mockito, Spring MockMvc

## Project layout

```text
src/main/java/com/portfolio/employeemanagement/
├── controller/    REST endpoints and browser route forwarding
├── dto/           Validated request and response objects
├── entity/        JPA employee model and employment status
├── exception/     Not-found, duplicate-email, and API error handling
├── repository/    Spring Data JPA persistence
└── service/       CRUD, filters, aggregates, CSV source data, demo seed
src/main/resources/
├── application.properties
├── application-mysql.properties
└── static/        Plain HTML, CSS, and JavaScript frontend
src/test/java/      Service unit tests and API integration tests
database/           Example MySQL schema
```

## Database

The `employees` table stores:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | BIGINT | Auto-increment primary key |
| `name` | VARCHAR(100) | Required |
| `email` | VARCHAR(150) | Required and unique |
| `phone` | VARCHAR(20) | Required |
| `department` | VARCHAR(100) | Required |
| `designation` | VARCHAR(100) | Required |
| `salary` | DECIMAL(12,2) | Monthly salary |
| `joining_date` | DATE | Required |
| `status` | VARCHAR(20) | `ACTIVE` or `INACTIVE` |

The default H2 database is stored in `data/employee-management` and persists across restarts. Hibernate creates or updates the table. For MySQL, see the setup below; the equivalent SQL is in `database/schema-mysql.sql`.

## Run in VS Code on Windows 11

### Requirements

- JDK 17
- Visual Studio Code with the Extension Pack for Java
- MySQL 8 for the MySQL profile (optional; H2 works without a separate server)

### Quick start with H2

Open this project folder in VS Code, then run in the integrated terminal:

```powershell
.\mvnw.cmd spring-boot:run
```

Open `http://localhost:8080`. The browser interface and API run from the same Spring Boot application.

### Use MySQL 8

1. Start MySQL and create the database:

   ```sql
   CREATE DATABASE employee_management;
   ```

   Or run `database/schema-mysql.sql` in MySQL Workbench. Hibernate also creates or updates the table when the application starts.

2. Copy `.env.example` as a reference and set these environment variables in the VS Code terminal or Java launch configuration. Spring Boot does not load `.env` files automatically.

   ```powershell
   $env:SPRING_PROFILES_ACTIVE = "mysql"
   $env:DB_URL = "jdbc:mysql://localhost:3306/employee_management?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   $env:DB_USERNAME = "root"
   $env:DB_PASSWORD = "your-local-mysql-password"
   ```

3. Start the app:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

Database credentials are read from environment variables and are not committed to Git.

## REST API

Base URL: `http://localhost:8080/api`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Health check |
| GET | `/employees` | List; supports `search`, `department`, `status`, `sortBy`, and `direction` |
| GET | `/employees/{id}` | Get an employee |
| POST | `/employees` | Create an employee; returns 201 |
| PUT | `/employees/{id}` | Update an employee |
| DELETE | `/employees/{id}` | Delete an employee; returns 204 |
| GET | `/employees/search?name=alex` | Search by name or numeric employee ID |
| GET | `/dashboard/stats` | Database-backed dashboard totals |
| GET | `/departments` | Department names and employee counts |
| GET | `/reports/employees.csv` | Download a CSV report |

Example employee JSON:

```json
{
  "name": "Alex Morgan",
  "email": "alex.morgan@example.com",
  "phone": "+1 555 010 1042",
  "department": "Engineering",
  "designation": "Software Engineer",
  "salary": 8200.00,
  "joiningDate": "2024-06-01",
  "status": "ACTIVE"
}
```

Invalid input returns HTTP 400 with field-level details. Missing IDs return 404 and duplicate email addresses return 409.

## Tests

Run the JUnit 5 and MockMvc tests:

```powershell
.\mvnw.cmd test
```

The suite covers service-layer email normalization and duplicate rejection, database-backed CRUD, search, filters, dashboard statistics, validation errors, CSV export, and browser route forwarding.

For manual API checks, import `postman/Employee-Management.postman_collection.json` into Postman. Update its `baseUrl` collection variable if the app runs on a different host or port.

## GitHub

Create an empty GitHub repository, then from this project folder:

```powershell
git init
git add .
git commit -m "Build employee management system"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/employee-management-system.git
git push -u origin main
```

GitHub Pages only hosts static files and cannot run this Spring Boot backend. To publish a live version, deploy the packaged Spring Boot JAR to a Java-capable host and configure the MySQL environment variables there.

## Screenshots

Add screenshots of the dashboard, employee directory, and employee form here after capturing them.
