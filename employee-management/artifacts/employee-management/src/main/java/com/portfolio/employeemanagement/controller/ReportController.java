package com.portfolio.employeemanagement.controller;

import com.portfolio.employeemanagement.dto.EmployeeResponse;
import com.portfolio.employeemanagement.service.EmployeeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private static final String[] CSV_HEADERS = {
            "Employee ID", "Full Name", "Email Address", "Phone Number", "Department",
            "Designation", "Monthly Salary", "Date of Joining", "Employment Status"
    };

    private final EmployeeService employeeService;

    public ReportController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping(value = "/employees.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportEmployees() {
        List<EmployeeResponse> employees = employeeService.getAllForReport();
        StringBuilder csv = new StringBuilder("\uFEFF");
        appendRow(csv, CSV_HEADERS);
        for (EmployeeResponse employee : employees) {
            appendRow(csv, new String[]{
                    String.valueOf(employee.id()),
                    employee.name(),
                    employee.email(),
                    employee.phone(),
                    employee.department(),
                    employee.designation(),
                    employee.salary().toPlainString(),
                    employee.joiningDate().toString(),
                    employee.status().name()
            });
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"employees.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private void appendRow(StringBuilder csv, String[] values) {
        for (int index = 0; index < values.length; index++) {
            if (index > 0) {
                csv.append(',');
            }
            csv.append(escapeCsv(values[index]));
        }
        csv.append("\r\n");
    }

    private String escapeCsv(String value) {
        String safeValue = value == null ? "" : value;
        if (!safeValue.isEmpty() && "=+-@\t\r".indexOf(safeValue.charAt(0)) >= 0) {
            safeValue = "'" + safeValue;
        }
        return "\"" + safeValue.replace("\"", "\"\"") + "\"";
    }
}
