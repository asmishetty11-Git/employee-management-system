package com.portfolio.employeemanagement.controller;

import com.portfolio.employeemanagement.dto.DashboardStats;
import com.portfolio.employeemanagement.service.EmployeeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final EmployeeService employeeService;

    public DashboardController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/stats")
    public DashboardStats getStats() {
        return employeeService.getDashboardStats();
    }
}
