package com.portfolio.employeemanagement.service;

import com.portfolio.employeemanagement.entity.Employee;
import com.portfolio.employeemanagement.entity.EmploymentStatus;
import com.portfolio.employeemanagement.repository.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DemoDataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;

    public DemoDataSeeder(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    public void run(String... args) {
        if (employeeRepository.count() > 0) {
            return;
        }

        employeeRepository.saveAll(List.of(
                new Employee(
                        "Alex Morgan",
                        "alex.morgan@example.com",
                        "+1 555 010 1042",
                        "Engineering",
                        "Software Engineer",
                        new BigDecimal("8200.00"),
                        LocalDate.now().minusYears(2).minusMonths(3),
                        EmploymentStatus.ACTIVE
                ),
                new Employee(
                        "Jordan Lee",
                        "jordan.lee@example.com",
                        "+1 555 010 2287",
                        "Design",
                        "Product Designer",
                        new BigDecimal("7600.00"),
                        LocalDate.now().minusYears(1).minusMonths(5),
                        EmploymentStatus.ACTIVE
                ),
                new Employee(
                        "Taylor Kim",
                        "taylor.kim@example.com",
                        "+1 555 010 3196",
                        "Operations",
                        "People Operations Associate",
                        new BigDecimal("6400.00"),
                        LocalDate.now().minusMonths(8),
                        EmploymentStatus.INACTIVE
                )
        ));
    }
}
