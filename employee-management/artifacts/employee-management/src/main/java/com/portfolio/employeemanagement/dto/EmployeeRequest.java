package com.portfolio.employeemanagement.dto;

import com.portfolio.employeemanagement.entity.EmploymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmployeeRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be 100 characters or fewer")
        String name,

        @NotBlank(message = "Email address is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 150, message = "Email address must be 150 characters or fewer")
        String email,

        @NotBlank(message = "Phone number is required")
        @Size(min = 5, max = 20, message = "Phone number must be between 5 and 20 characters")
        String phone,

        @NotBlank(message = "Department is required")
        @Size(max = 100, message = "Department must be 100 characters or fewer")
        String department,

        @NotBlank(message = "Designation is required")
        @Size(max = 100, message = "Designation must be 100 characters or fewer")
        String designation,

        @NotNull(message = "Monthly salary is required")
        @DecimalMin(value = "0.01", message = "Salary must be greater than zero")
        @Digits(integer = 10, fraction = 2, message = "Salary can have up to 10 whole-number digits and 2 decimal places")
        BigDecimal salary,

        @NotNull(message = "Date of joining is required")
        LocalDate joiningDate,

        @NotNull(message = "Employment status is required")
        EmploymentStatus status
) {
}
