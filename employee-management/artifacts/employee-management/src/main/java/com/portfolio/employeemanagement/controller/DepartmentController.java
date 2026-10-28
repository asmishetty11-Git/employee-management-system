package com.portfolio.employeemanagement.controller;

import com.portfolio.employeemanagement.dto.DepartmentSummary;
import com.portfolio.employeemanagement.service.EmployeeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final EmployeeService employeeService;

    public DepartmentController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<DepartmentSummary> getDepartments() {
        return employeeService.getDepartments();
    }
}
