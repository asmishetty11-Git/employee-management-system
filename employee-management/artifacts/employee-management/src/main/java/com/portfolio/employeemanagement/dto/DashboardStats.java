package com.portfolio.employeemanagement.dto;

import java.math.BigDecimal;

public record DashboardStats(
        long totalEmployees,
        long activeEmployees,
        long totalDepartments,
        BigDecimal averageSalary
) {
}
