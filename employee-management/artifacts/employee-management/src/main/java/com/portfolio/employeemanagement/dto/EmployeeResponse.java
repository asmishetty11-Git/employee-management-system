package com.portfolio.employeemanagement.dto;

import com.portfolio.employeemanagement.entity.Employee;
import com.portfolio.employeemanagement.entity.EmploymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmployeeResponse(
        Long id,
        String name,
        String email,
        String phone,
        String department,
        String designation,
        BigDecimal salary,
        LocalDate joiningDate,
        EmploymentStatus status
) {
    public static EmployeeResponse from(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getName(),
                employee.getEmail(),
                employee.getPhone(),
                employee.getDepartment(),
                employee.getDesignation(),
                employee.getSalary(),
                employee.getJoiningDate(),
                employee.getStatus()
        );
    }
}
