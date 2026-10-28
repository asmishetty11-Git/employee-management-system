package com.portfolio.employeemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.employeemanagement.entity.Employee;
import com.portfolio.employeemanagement.entity.EmploymentStatus;
import com.portfolio.employeemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:employee-test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false"
})
class EmployeeApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void clearDatabase() {
        employeeRepository.deleteAll();
    }

    @Test
    void supportsEmployeeCrudSearchFiltersAndDatabaseBackedStats() throws Exception {
        String payload = objectMapper.writeValueAsString(employeePayload(
                "Alex Morgan",
                "alex.morgan@example.com",
                "Engineering",
                "ACTIVE",
                "8200.00"
        ));

        String createdJson = mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("alex.morgan@example.com"))
                .andExpect(jsonPath("$.id").isNumber())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long employeeId = objectMapper.readTree(createdJson).get("id").asLong();

        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(employeeId));

        mockMvc.perform(get("/api/employees/{id}", employeeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(employeeId))
                .andExpect(jsonPath("$.name").value("Alex Morgan"));

        mockMvc.perform(get("/api/employees/search").param("name", "alex"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/employees")
                        .param("search", String.valueOf(employeeId))
                        .param("department", "engineering")
                        .param("status", "ACTIVE")
                        .param("sortBy", "name")
                        .param("direction", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(1))
                .andExpect(jsonPath("$.activeEmployees").value(1))
                .andExpect(jsonPath("$.totalDepartments").value(1))
                .andExpect(jsonPath("$.averageSalary").value(8200.0));

        String updatedPayload = objectMapper.writeValueAsString(employeePayload(
                "Alex Morgan Updated",
                "alex.morgan@example.com",
                "Engineering",
                "INACTIVE",
                "9000.00"
        ));
        mockMvc.perform(put("/api/employees/{id}", employeeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alex Morgan Updated"))
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/employees/99999"))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/employees/{id}", employeeId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void rejectsInvalidEmployeePayloadWithReadableValidationErrors() throws Exception {
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"email\":\"not-an-email\",\"salary\":-10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Please correct the highlighted fields."))
                .andExpect(jsonPath("$.details").isArray());
    }

    @Test
    void exportsCsvReport() throws Exception {
        employeeRepository.save(new Employee(
                "Csv Example",
                "csv@example.com",
                "+1 555 010 1234",
                "Engineering",
                "Engineer",
                new BigDecimal("7000.00"),
                LocalDate.of(2024, 1, 15),
                EmploymentStatus.ACTIVE
        ));

        mockMvc.perform(get("/api/reports/employees.csv"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("csv@example.com")));
    }

    @Test
    void servesTheBrowserAppAtItsRoutes() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl("/index.html"));

        mockMvc.perform(get("/employees"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl("/index.html"));
    }

    private Map<String, Object> employeePayload(
            String name,
            String email,
            String department,
            String status,
            String salary
    ) {
        return Map.of(
                "name", name,
                "email", email,
                "phone", "+1 555 010 1042",
                "department", department,
                "designation", "Software Engineer",
                "salary", new BigDecimal(salary),
                "joiningDate", "2023-06-01",
                "status", status
        );
    }
}
